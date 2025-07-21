// Simple test component for Builder.io
export default function TestComponent(props: any) {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div style={{
      padding: '40px',
      backgroundColor: '#ff0000',
      color: '#ffffff',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      border: '5px solid #00ff00',
      margin: '20px'
    }}>
      🚀 BUILDER.IO TEST COMPONENT 🚀
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <br />
      This should be VERY visible!
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <br />
      Props: {JSON.stringify(props)}
    </div>
  );
}
