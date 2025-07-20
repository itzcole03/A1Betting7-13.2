// Simple test component for Builder.io
export default function TestComponent(props: any) {
  return (
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
      <br />
      This should be VERY visible!
      <br />
      Props: {JSON.stringify(props)}
    </div>
  );
}
