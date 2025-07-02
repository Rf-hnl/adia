import { NextRequest, NextResponse } from 'next/server';
import { analyzeAdCreatives } from '@/ai/flows/analyze-ad-creatives';
import { firebaseAnalytics } from '@/lib/firebase-analytics';
import { db } from '@/lib/firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.image || !body.demographics || !body.objective) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['image', 'demographics', 'objective'],
        received: Object.keys(body)
      }, { status: 400 });
    }

    const { image, demographics, objective } = body;

    // Validate image format (base64 or URL)
    if (typeof image !== 'string') {
      return NextResponse.json({
        error: 'Image must be a string (base64 or URL)'
      }, { status: 400 });
    }

    // Check if it's a valid URL or base64
    const isBase64 = image.startsWith('data:image/');
    const isUrl = image.startsWith('http://') || image.startsWith('https://');
    
    if (!isBase64 && !isUrl) {
      return NextResponse.json({
        error: 'Image must be either a base64 data URI (data:image/...) or a valid HTTP/HTTPS URL'
      }, { status: 400 });
    }

    // Validate demographics
    if (typeof demographics !== 'string' || demographics.length < 10) {
      return NextResponse.json({
        error: 'Demographics must be a descriptive string (minimum 10 characters)'
      }, { status: 400 });
    }

    // Validate objective
    if (typeof objective !== 'string' || objective.length < 5) {
      return NextResponse.json({
        error: 'Objective must be a descriptive string (minimum 5 characters)'
      }, { status: 400 });
    }

    console.log('🔥 Webhook received:', { 
      demographics: demographics.slice(0, 50) + '...', 
      objective, 
      imageType: isBase64 ? 'base64' : 'url',
      imagePreview: isBase64 ? 'data:image/...' : image
    });

    // Create analytics data for webhook user
    const startTime = Date.now();
    
    // Generate anonymous user for webhook request
    const webhookUserId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const webhookUserData = {
      id: webhookUserId,
      createdAt: new Date(),
      deviceInfo: {
        platform: 'webhook',
        userAgent: request.headers.get('user-agent') || 'unknown',
        language: 'unknown',
        timezone: 'unknown'
      }
    };

    // Process the analysis using analyzeAdCreatives which provides complete breakdown
    let analysisResult;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        analysisResult = await analyzeAdCreatives({ 
          creativeDataUri: image, 
          demographics, 
          objective 
        });
        break; // Success, exit retry loop
      } catch (aiError: any) {
        retryCount++;
        console.warn(`⚠️ AI analysis attempt ${retryCount} failed:`, aiError.message);
        
        if (retryCount > maxRetries) {
          // If all retries failed, throw a more user-friendly error
          if (aiError.message?.includes('overloaded') || aiError.message?.includes('503')) {
            throw new Error('El servicio de análisis de IA está temporalmente sobrecargado. Por favor, inténtalo de nuevo en unos minutos.');
          } else if (aiError.message?.includes('Provided image is not valid')) {
            throw new Error('La imagen proporcionada no es válida o no se puede procesar. Verifica que la URL sea accesible y apunte a una imagen válida.');
          } else {
            throw new Error(`Error en el análisis de IA: ${aiError.message}`);
          }
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    const processingTime = Date.now() - startTime;

    // Save analysis to Firebase
    try {
      // Create webhook user document
      const userRef = doc(db, 'anonymous_users', webhookUserId);
      await setDoc(userRef, {
        ...webhookUserData,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp(),
        analysisCount: 1,
        feedbackCount: 0,
        sessionCount: 1
      });

      // Create analysis session document
      const sessionData = {
        anonymousUserId: webhookUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Image data
        imageHash: isBase64 ? 'base64_webhook' : image,
        imageSource: isBase64 ? 'base64' : 'url',
        imageUrl: isUrl ? image : null, // Store the actual URL if it's a URL
        
        // Input data
        demographics,
        objective,
        
        // AI Results
        results: {
          performanceScore: analysisResult!.performanceScore,
          clarityScore: analysisResult!.clarityScore,
          designScore: analysisResult!.designScore,
          audienceAffinityScore: analysisResult!.audienceAffinityScore,
          recommendations: analysisResult!.recommendations || []
        },
        
        // Performance metrics
        processingTimeMs: processingTime,
        aiModelVersion: '1.0.0',
        source: 'webhook',
        
        // Device info from webhook
        deviceInfo: webhookUserData.deviceInfo,
        sessionId: `webhook_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const sessionRef = await addDoc(collection(db, 'analysis_sessions'), sessionData);
      const sessionId = sessionRef.id;

      console.log('✅ Webhook analysis saved to Firebase:', {
        userId: webhookUserId,
        sessionId,
        processingTime,
        imageType: isBase64 ? 'base64' : 'url',
        imageUrl: isUrl ? image : null
      });

    } catch (firebaseError) {
      console.error('❌ Error saving to Firebase:', firebaseError);
      // Continue execution even if Firebase fails
    }

    // Format the response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      analysis: {
        "Desglose del rendimiento": {
          "Puntuación de rendimiento general": analysisResult!.performanceScore,
          "Claridad y legibilidad": analysisResult!.clarityScore,
          "Atractivo del diseño": analysisResult!.designScore,
          "Afinidad con la audiencia": analysisResult!.audienceAffinityScore
        },
        "Recomendaciones de IA": analysisResult!.recommendations || []
      },
      metadata: {
        processingTimeMs: processingTime,
        demographics,
        objective,
        imageSource: isBase64 ? 'base64' : 'url',
        version: "1.0.0",
        sessionId: webhookUserId
      }
    };

    console.log('✅ Webhook analysis completed:', {
      performanceScore: analysisResult!.performanceScore,
      clarityScore: analysisResult!.clarityScore,
      designScore: analysisResult!.designScore,
      audienceAffinityScore: analysisResult!.audienceAffinityScore,
      recommendationsCount: analysisResult!.recommendations?.length || 0
    });

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);

    // Return error response
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}