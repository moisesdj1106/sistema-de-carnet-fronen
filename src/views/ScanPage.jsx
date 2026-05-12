import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanPage() {
  const [mode, setMode] = useState('qr');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const html5QrRef = useRef(null);
  const processingRef = useRef(false); // ← bloqueo anti-duplicados
  const navigate = useNavigate();

  const processCode = async (cardCode) => {
    // Si ya está procesando un escaneo, ignorar
    if (processingRef.current) return;
    processingRef.current = true;
    setError(''); setResult(null);
    
    try {
      const res = await api.scan(cardCode.trim());
      
      // Si hay error 404 (ruta no existe en el backend)
      if (res.status === 404) {
        setError('⚠️ Servicio temporalmente no disponible. Intenta más tarde.');
        processingRef.current = false;
        return;
      }
      
      // Para otros errores
      if (!res.ok) {
        try {
          const data = await res.json();
          setError(data.error || 'Código no válido');
        } catch {
          setError(`Error ${res.status}: ${res.statusText}`);
        }
        processingRef.current = false;
        return;
      }
      
      // Éxito - verificar que la respuesta tenga la estructura correcta
      const data = await res.json();
      
      // Verificar estructura mínima requerida
      if (!data.worker) {
        console.error('Respuesta del servidor incompleta:', data);
        setError('Error: Respuesta del servidor incompleta');
        processingRef.current = false;
        return;
      }

      // Ajustar el manejo de event_type para evitar errores
      const eventType = data.attendance?.event_type;
      const eventLabel = eventType === 'entry' ? '✅ ENTRADA' : eventType === 'exit' ? '🚪 SALIDA' : '❓ DESCONOCIDO';

      if (!eventType) {
        console.warn('Falta event_type en la respuesta:', data);
      }

      setResult({
        ...data,
        attendance: {
          ...data.attendance,
          event_type: eventType || 'desconocido',
          event_label: eventLabel,
        },
      });

      setTimeout(() => {
        setResult(null);
        processingRef.current = false;
      }, 5000);
      
    } catch (error) {
      console.error('Error en processCode:', error);
      setError('Error de conexión con el servidor');
      processingRef.current = false;
    }
  };

  const startScanner = async () => {
    if (scanning) return;
    setScanning(true);
    html5QrRef.current = new Html5Qrcode('qr-reader');
    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            await processCode(parsed.card_code || decodedText);
          } catch {
            await processCode(decodedText);
          }
        },
        () => {}
      );
    } catch {
      setError('No se pudo acceder a la cámara');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current && scanning) {
      await html5QrRef.current.stop().catch(() => {});
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleModeChange = async (m) => {
    await stopScanner();
    setMode(m); setError(''); setResult(null);
  };

  const handleManual = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    await processCode(code);
    setCode('');
  };

  return (
    <div className="scan-container">
      {/* Botón admin esquina superior derecha */}
      <button
        onClick={() => navigate('/login')}
        style={{
          position: 'fixed', top: 16, right: 16,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '7px 14px',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
      >
        🔐 Admin
      </button>

      <div className="scan-logo">VEX <span>SHOP</span></div>
      <div className="scan-subtitle">SISTEMA DE CONTROL DE ASISTENCIA</div>

      <div className="scan-box">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['qr', 'manual'].map(m => (
            <button key={m} onClick={() => handleModeChange(m)} style={{
              flex: 1, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: mode === m ? '#cc0000' : '#f7f8fc',
              color: mode === m ? 'white' : '#555',
              fontWeight: 600, fontSize: 14,
              transition: 'all 0.2s',
            }}>
              {m === 'qr' ? '📷 Escanear QR' : '⌨️ Código Manual'}
            </button>
          ))}
        </div>

        {mode === 'qr' && (
          <div>
            <div id="qr-reader" style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }} />
            {!scanning ? (
              <button className="btn-vex" style={{ width: '100%', marginTop: 16, padding: 12 }} onClick={startScanner}>
                Iniciar Cámara
              </button>
            ) : (
              <button onClick={stopScanner} style={{
                width: '100%', marginTop: 16, padding: 12, background: '#f7f8fc',
                color: '#555', border: '1.5px solid #e8eaf0', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
              }}>
                Detener Cámara
              </button>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <form onSubmit={handleManual}>
            <input
              className="login-input"
              placeholder="Ingresa el código del carnet"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{ textTransform: 'uppercase', letterSpacing: 2 }}
              autoFocus
            />
            <button className="btn-vex" style={{ width: '100%', padding: 12 }} type="submit">
              Registrar
            </button>
          </form>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 10, color: '#cc0000', fontSize: 14, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {result && result.worker && result.attendance && (
        <div className="scan-result">
          {result.worker.photo_url
            ? <img src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}${result.worker.photo_url}`} alt="foto" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 12px' }}>👤</div>
          }
          <div className="worker-name">{result.worker.full_name || 'Nombre no disponible'}</div>
          <div className="worker-pos">{result.worker.position_name || '-'}</div>
          <div style={{
            display: 'inline-block', padding: '8px 28px', borderRadius: 24,
            background: result.attendance.event_type === 'entry' ? '#e8f5e9' : '#fce4e4',
            color: result.attendance.event_type === 'entry' ? '#2e7d32' : '#c62828',
            fontWeight: 800, fontSize: 17, letterSpacing: 1,
          }}>
            {result.attendance.event_type === 'entry' ? '✅ ENTRADA' : result.attendance.event_type === 'exit' ? '🚪 SALIDA' : '❓ DESCONOCIDO'}
          </div>
          <div style={{ color: '#aaa', fontSize: 13, marginTop: 10 }}>
            {result.attendance.logged_at ? new Date(result.attendance.logged_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      )}
    </div>
  );
}
