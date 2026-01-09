"use client";

import { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Spline from '@splinetool/react-spline';

interface SplineSceneProps {
  sceneUrl: string;
  enableInteraction?: boolean;
}

const SplineScene = memo(({ sceneUrl, enableInteraction = true }: SplineSceneProps) => {
  const router = useRouter();

  // ✅ Debug mount
  useEffect(() => {
    console.log('🚀 SplineScene mounted');
    console.log('Scene URL:', sceneUrl);
    console.log('Interaction enabled:', enableInteraction);
  }, []);

  // ✅ Cleanup cursor
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  // ✅ Handle click
  function onSplineClick(e: any) {
    console.log('🎯 onSplineClick triggered!');
    console.log('enableInteraction:', enableInteraction);
    console.log('Event:', e);
    console.log('Target:', e.target);
    console.log('Target name:', e.target?.name);
    console.log('Target id:', e.target?.id);
    console.log('Target type:', e.target?.type);

    if (!enableInteraction) {
      console.log('Interaction disabled');
      return;
    }

    const targetName = e.target?.name;
    console.log('🖱️ CLICKED OBJECT NAME:', targetName);

    // ⚠️ ALWAYS log unhandled clicks to see what objects are clickable
    if (!targetName) {
      console.warn('⚠️ Clicked object has no name!');
      return;
    }

    switch(targetName) {
      case 'CTA':
        console.log('🚀 CTA clicked! Navigating to Trading Dashboard...');
        router.push('/TradingDashboard/btc-usdc');
        break;

      case 'ACCESS TERMINAL':
      case 'TERMINAL':
        console.log('Opening terminal...');
        break;

      case 'TRANSMISSION LOGS':
      case 'LOGS':
        console.log('Opening logs...');
        break;

      case 'BIO ARCHIVE':
      case 'ARCHIVE':
        console.log('Opening archive...');
        break;

      case 'INITIATE CONTACT':
      case 'CONTACT':
        console.log('Initiating contact...');
        router.push('/contact');
        break;

      case 'JOIN THE HARVEST':
      case 'HARVEST':
      case 'JOIN':
        console.log('🚀 Navigating to Trading Dashboard...');
        router.push('/tradingdashboard/btc-usdc');
        break;

      case 'EXPLORE DOCS':
      case 'DOCS':
        console.log('Opening docs...');
        router.push('/docs');
        break;

      case 'WATCH DEMO':
      case 'DEMO':
        console.log('Playing demo...');
        break;

      default:
        console.warn('⚠️ UNHANDLED CLICK - Object name:', targetName);
        console.warn('💡 Add this name to the switch statement to handle it!');
        break;
    }
  }

  // ✅ Handle hover
  function onSplineHover(e: any) {
    if (!enableInteraction) return;

    const targetName = e.target?.name;

    // Debug: log all hover events
    if (targetName) {
      console.log('👆 Hovering over:', targetName);
    }

    if (targetName && (
        targetName === 'CTA' ||
        targetName.includes('JOIN') ||
        targetName.includes('HARVEST') ||
        targetName.includes('CONTACT') ||
        targetName.includes('TERMINAL') ||
        targetName.includes('DOCS') ||
        targetName.includes('DEMO')
    )) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  }

  // ✅ Validate sceneUrl
  if (!sceneUrl) {
    console.error('❌ Missing sceneUrl prop');
    return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-red-500">Error: Missing scene URL</p>
        </div>
    );
  }

  return (
      <div
          className="w-full h-full relative"
          style={{ overflow: 'hidden' }}
      >
        <Spline
            scene={sceneUrl}
            // ✅ FIX: Dùng inline style thay vì style object
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: enableInteraction ? 'auto' : 'none', // ✅ Thêm dòng này
            }}
            onLoad={() => {
              console.log('✅ Spline scene loaded successfully');
            }}
            onError={(error: any) => {
              console.error('❌ Spline error:', error);
            }}
            // ✅ Try multiple event handlers
            onMouseDown={(e: any) => {
              console.log('🔵 onMouseDown triggered!', e);
              onSplineClick(e);
            }}
            onSplineMouseDown={(e: any) => {
              console.log('🟢 onSplineMouseDown triggered!', e);
              onSplineClick(e);
            }}
            onClick={(e: any) => {
              console.log('🟡 onClick triggered!', e);
              onSplineClick(e);
            }}
            onSplineMouseHover={onSplineHover}
        />
      </div>
  );
});

SplineScene.displayName = 'SplineScene';

export default SplineScene;
