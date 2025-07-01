export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect width="32" height="32" rx="8" fill="hsl(var(--primary))"/>
        <path d="M9.42857 21V11H12.5L16.2143 17.25V11H18.5714V21H15.5L11.7857 14.75V21H9.42857Z" fill="hsl(var(--primary-foreground))"/>
        <path d="M20.5 21H23.5V11H20.5V21Z" fill="hsl(var(--primary-foreground))"/>
    </svg>
)
