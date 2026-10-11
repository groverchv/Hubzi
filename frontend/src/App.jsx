import React from 'react';
import ArcadeArena from './pages/ArcadeArena';
import AnimatedCloudsBackground from './components/AnimatedCloudsBackground';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <AnimatedCloudsBackground />
      <ArcadeArena />
    </div>
  );
}

export default App;
