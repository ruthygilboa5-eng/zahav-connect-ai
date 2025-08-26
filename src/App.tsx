const App = () => {
  console.log('App component rendering...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: 'black', fontSize: '24px', marginBottom: '20px' }}>
        🔍 DEBUG MODE - Minimal App
      </h1>
      <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
        <p style={{ margin: '0 0 10px 0' }}>✅ App component is rendering</p>
        <p style={{ margin: '0 0 10px 0' }}>📍 Current route: {window.location.pathname}</p>
        <p style={{ margin: '0' }}>⏰ Timestamp: {new Date().toLocaleString()}</p>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#2d5a2d' }}>Status:</h2>
        <p style={{ margin: '0', color: '#2d5a2d' }}>
          If you can see this message, the basic React app is working without any providers or complex components.
        </p>
      </div>
    </div>
  );
};

export default App;