export default function MyComponent(props: any) {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div style={{ 
      padding: '30px', 
      border: '3px solid #06b6d4', 
      borderRadius: '12px', 
      backgroundColor: '#1f2937',
      color: '#ffffff',
      textAlign: 'center',
      margin: '20px',
      boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h1 style={{ 
        marginBottom: '15px', 
        color: '#06b6d4',
        fontSize: '32px',
        fontWeight: 'bold',
        textShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
      }}>
        🎯 A1BETTING COMPONENT 🎯
      </h1>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p style={{ 
        marginBottom: '20px', 
        fontSize: '18px',
        color: '#e5e7eb'
      }}>
        ✅ This component is now visible and working!
      </p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div style={{ 
        marginTop: '20px', 
        fontSize: '14px', 
        color: '#9ca3af',
        backgroundColor: '#374151',
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'left'
      }}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <strong style={{ color: '#06b6d4' }}>Component Props:</strong><br/>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <pre style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(props, null, 2)}
        </pre>
      </div>
    </div>
  );
}
