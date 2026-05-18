import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation, useParams} from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://studio-os-backend-production.up.railway.app';
axios.defaults.baseURL = API_URL;

// 1. CONFIGURACIÓN DE SEGURIDAD PARA AXIOS
const configurarAxios = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};
configurarAxios();

// HELPER PARA RUTAS DE IMÁGENES
const getImagenUrl = (ruta) => {
  if (!ruta) return 'https://placehold.co/150x150/18181b/10b981?text=Sin+Foto';
  if (ruta.startsWith('http') || ruta.startsWith('data:')) return ruta;
  return `${API_URL}/${ruta.replace(/^\//, '')}`;
};

// 2. PROTECCIÓN DE RUTAS PRIVADAS
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

// 3. PANTALLA DE INICIO (LANDING)
function Inicio() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative">
      
      {/* HEADER DISCRETO PARA EL DUEÑO (ESQUINA SUPERIOR DERECHA) */}
      <header className="absolute top-0 w-full p-6 flex justify-end">
        <Link 
          to="/login" 
          className="text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 hover:underline transition-all"
        >
          Iniciar Sesión
        </Link>
      </header>

      {/* CONTENIDO PRINCIPAL PARA EL CLIENTE (CENTRADO) */}
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-emerald-400 uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          TATTOO STUDIO
        </h1>
        <p className="text-lg text-zinc-400 mb-12 text-center max-w-sm italic">
          Convierte tu idea en arte. Agenda tu sesión hoy.
        </p>
        
        <Link 
          to="/cotizar" 
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 px-12 rounded-full transition-all hover:scale-105 uppercase text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          COTIZAR AHORA
        </Link>
      </div>
      
    </div>
  )
}

// 4. PANTALLA DE LOGIN
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const res = await axios.post('/auth/login', formData);
      localStorage.setItem('token', res.data.access_token);
      configurarAxios();
      navigate('/admin');
    } catch (err) {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 w-full max-w-sm space-y-6 shadow-2xl">
        <h2 className="text-3xl font-black text-emerald-400 italic">STUDIO LOGIN</h2>
        {error && <p className="text-red-400 text-xs font-bold uppercase">{error}</p>}
        <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
        <input required type="password" placeholder="Clave" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500" />
        <button type="submit" className="w-full bg-emerald-500 text-black py-4 rounded-xl font-black uppercase">Entrar</button>
      </form>
    </div>
  );
}

// 5. FORMULARIO DE CLIENTE (PÚBLICO)
function Formulario() {
  const [formData, setFormData] = useState({ 
    nombre: '', telefono: '', email: '', instagram: '',
    idea: '', zona: '', tamano: '', contacto_pref: 'whatsapp'
  })
  const [imagen, setImagen] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setCargando(true); 
    setMensaje('');
    try {
      const infoContacto = `Preferencia: ${formData.contacto_pref.toUpperCase()} | IG: ${formData.instagram || 'No ingresado'}`;
      
      const resCliente = await axios.post('/clientes/', {
        nombre_completo: formData.nombre, 
        telefono: formData.telefono, 
        email: formData.email, 
        notas_medicas: infoContacto
      })
      
      const cotData = new FormData();
      cotData.append('cliente_id', resCliente.data.id);
      cotData.append('descripcion_idea', formData.idea);
      cotData.append('zona_cuerpo', formData.zona);
      cotData.append('tamano_cm', formData.tamano);
      if (imagen) cotData.append('imagen', imagen);
      
      await axios.post('/cotizaciones/', cotData);
      
      setMensaje('¡Cotización enviada con éxito! Te contactaremos por tu medio preferido.');
      setFormData({ nombre: '', telefono: '', email: '', instagram: '', idea: '', zona: '', tamano: '', contacto_pref: 'whatsapp' });
      setImagen(null);
    } catch (err) { 
      setMensaje('Hubo un error al enviar. Intenta nuevamente.'); 
    } finally { 
      setCargando(false); 
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col py-10 px-4 items-center justify-center">
      <div className="w-full max-w-md">
        <Link to="/" className="text-zinc-500 font-bold text-xs uppercase hover:text-emerald-400 transition-colors mb-6 inline-block">
          ← Volver al inicio
        </Link>

        <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
          <h2 className="text-3xl font-black text-emerald-400 mb-2 text-center italic uppercase tracking-tighter">COTIZAR IDEA</h2>
          <p className="text-zinc-500 text-xs text-center mb-8 font-bold">Completa los datos para evaluar tu diseño</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <input required name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre completo" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors" />
            
            <div className="grid grid-cols-2 gap-4">
              <input required name="telefono" value={formData.telefono} onChange={handleChange} placeholder="WhatsApp (+569...)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors" />
              <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram (@usuario)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors" />
            </div>
            
            <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Correo electrónico" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors" />

            <div className="space-y-2 pt-2 border-t border-zinc-800/50">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quiero recibir el presupuesto por:</label>
              <div className="grid grid-cols-3 gap-2">
                {['whatsapp', 'instagram', 'email'].map(metodo => (
                  <label key={metodo} className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                    formData.contacto_pref === metodo 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-black' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'
                  }`}>
                    <input type="radio" name="contacto_pref" value={metodo} checked={formData.contacto_pref === metodo} onChange={handleChange} className="hidden" />
                    <span className="text-[9px] uppercase tracking-widest">{metodo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/50">
              <input required name="zona" value={formData.zona} onChange={handleChange} placeholder="Zona (ej. Antebrazo)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors" />
              <input required name="tamano" value={formData.tamano} onChange={handleChange} placeholder="Tamaño (ej. 15x10 cm)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors" />
            </div>

            <textarea required name="idea" value={formData.idea} onChange={handleChange} placeholder="Describe tu diseño, estilo, colores..." rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 transition-colors resize-none" />
            
            <div className="relative">
              <input required type="file" id="archivo" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} className="hidden" />
              <label htmlFor="archivo" className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                imagen ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-emerald-500/50 hover:bg-zinc-900'
              }`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <span className="text-2xl mb-2">{imagen ? '✅' : '📸'}</span>
                  <p className="text-xs font-bold text-zinc-400 truncate w-full max-w-[250px]">
                    {imagen ? imagen.name : "Click aquí para subir referencia"}
                  </p>
                  {!imagen && <p className="text-[9px] text-zinc-600 uppercase mt-1 font-black">PNG, JPG, JPEG</p>}
                </div>
              </label>
            </div>

            <button type="submit" disabled={cargando} className="w-full py-4 rounded-xl font-black bg-emerald-500 text-black hover:bg-emerald-400 uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              {cargando ? 'ENVIANDO DATOS...' : 'ENVIAR COTIZACIÓN'}
            </button>

            {mensaje && (
              <div className="bg-zinc-950 border border-emerald-500/30 p-3 rounded-xl mt-4">
                <p className="text-center text-emerald-400 font-bold uppercase text-[10px] tracking-widest">{mensaje}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lógica inteligente: Si la pantalla es grande (PC), inicia abierto. Si es móvil, inicia cerrado.
  const [menuAbierto, setMenuAbierto] = useState(window.innerWidth > 768);

  // Efecto para que se ajuste automáticamente si el usuario gira el celular o achica la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setMenuAbierto(false);
      else setMenuAbierto(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { nombre: 'Mesa de Trabajo', ruta: '/admin', icono: '🖋️' },
    { nombre: 'Mi Agenda', ruta: '/calendario', icono: '📅' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      
      {/* BOTÓN HAMBURGUESA (Ahora es visible en PC y Móvil) */}
      <button 
        onClick={() => setMenuAbierto(!menuAbierto)}
        className="fixed top-4 left-4 z-[70] bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-lg hover:bg-zinc-800 transition-colors"
      >
        <span className="text-xl leading-none">{menuAbierto ? '✕' : '☰'}</span>
      </button>

      {/* FONDO OSCURO (Solo en celular para que no estorbe el contenido al abrir) */}
      {menuAbierto && (
        <div 
          onClick={() => setMenuAbierto(false)}
          className="md:hidden fixed inset-0 bg-black/80 z-[50] backdrop-blur-sm"
        ></div>
      )}

      {/* MENÚ LATERAL (Ocultable en todas las pantallas) */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col z-[60] transition-transform duration-300 ease-in-out ${
        menuAbierto ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Espacio extra arriba para que el texto no choque con el botón de la ✕ */}
        <div className="flex justify-start items-center mb-10 mt-14">
          <h1 className="text-2xl font-black text-emerald-400 italic tracking-tighter uppercase pl-2">STUDIO OS</h1>
        </div>
        
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.ruta}
              to={item.ruta}
              // En celular, cerramos el menú al hacer clic en una ruta. En PC lo dejamos abierto.
              onClick={() => { if(window.innerWidth <= 768) setMenuAbierto(false) }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                location.pathname === item.ruta 
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span>{item.icono}</span>
              {item.nombre}
            </Link>
          ))}
        </nav>
        
        <button 
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-500/10 rounded-xl transition-all"
        >
          <span>🚪</span> Salir
        </button>
      </aside>
      
      {/* CONTENEDOR PRINCIPAL */}
      {/* En PC, si el menú está abierto, empujamos el contenido a la derecha (md:ml-64). Si está cerrado, ocupa todo. */}
      <main className={`flex-grow w-full p-4 pt-20 md:p-8 md:pt-20 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
        menuAbierto ? 'md:ml-64' : 'ml-0'
      }`}>
        {children}
      </main>
    </div>
  );
}

// 6. PANEL DE ADMINISTRACIÓN (PRIVADO)
function AdminPanel() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  
  const [modal, setModal] = useState({ abierto: false, cot: null })
  const [modalAgenda, setModalAgenda] = useState({ abierto: false, cot: null })
  
  const [respuesta, setRespuesta] = useState({ precio: '', horas: '', notas: '' })
  const [nuevaCita, setNuevaCita] = useState({ fecha: '' })
  
  const [fotoFull, setFotoFull] = useState(null)
  const navigate = useNavigate();

  const getFechaMinima = () => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
  };

  const obtenerDatos = async () => {
    try {
      const res = await axios.get('/cotizaciones/mesa-trabajo')
      setCotizaciones(res.data)
    } catch (err) { 
      if(err.response?.status === 401) navigate('/login'); 
    } finally { 
      setCargando(false) 
    }
  }

  useEffect(() => { obtenerDatos() }, [])

  const enviarRespuesta = async (metodo) => {
    if (!respuesta.precio || !respuesta.horas) {
      return alert("Por favor ingresa el precio y las horas estimadas.");
    }
    const fd = new FormData();
    fd.append('precio', respuesta.precio); 
    fd.append('horas', respuesta.horas); 
    fd.append('notas', respuesta.notas);
    
    try {
      await axios.patch(`/cotizaciones/${modal.cot.id}/responder`, fd);
      
      const linkReserva = `https://studio-os-frontend-iota.vercel.app/reserva/${modal.cot.id}`;
      const textoPresupuesto = `¡Hola ${modal.cot.cliente}! Revisé tu idea para el tatuaje. El valor estimado es de $${respuesta.precio} y nos tomaría unas ${respuesta.horas} horas de sesión. ${respuesta.notas ? '\nNotas técnicas: ' + respuesta.notas : ''}\n\nPara confirmar tu diseño y elegir tu hora, entra a tu link personal:\n${linkReserva}`;
      
      if (metodo === 'whatsapp') {
        window.open(`https://wa.me/${modal.cot.telefono.replace(/\+/g,'')}?text=${encodeURIComponent(textoPresupuesto)}`, '_blank');
      } 
      else if (metodo === 'email') {
        window.open(`mailto:?subject=Tu Cotización de Tatuaje en Studio OS&body=${encodeURIComponent(textoPresupuesto)}`, '_blank');
      } 
      else if (metodo === 'instagram') {
        navigator.clipboard.writeText(textoPresupuesto);
        alert("✅ Mensaje copiado. Se abrirá Instagram, busca al cliente y pega el mensaje.");
        window.open(`https://www.instagram.com/direct/inbox/`, '_blank');
      }
      
      setModal({ abierto: false, cot: null }); 
      setRespuesta({ precio: '', horas: '', notas: '' });
      obtenerDatos();
    } catch (err) { 
      alert("Error al guardar la respuesta en la base de datos."); 
    }
  }

  const confirmarCita = async (e) => {
    if (e) e.preventDefault();
    if (!nuevaCita.fecha) return alert("Por favor selecciona una fecha y hora.");

    const fechaSeleccionada = new Date(nuevaCita.fecha);
    const ahora = new Date();
    if (fechaSeleccionada < ahora) {
      return alert("❌ Error: No puedes agendar una cita en el pasado.");
    }

    try {
      const inicio = new Date(nuevaCita.fecha);
      const fin = new Date(inicio.getTime() + (2 * 60 * 60 * 1000));
      
      await axios.post('/citas/', {
        cotizacion_id: modalAgenda.cot.id,
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString()
      });

      alert("✅ Sesión agendada con éxito");
      setModalAgenda({ abierto: false, cot: null });
      setNuevaCita({ fecha: '' });
      obtenerDatos();
    } catch (err) { 
      console.error(err);
      alert("Error al agendar la cita. Revisa los datos."); 
    }
  }

  const visibles = filtroEstado === 'todos' 
    ? cotizaciones 
    : cotizaciones.filter(c => c.estado === filtroEstado);

  const totalPendientes = cotizaciones.filter(c => c.estado === 'pendiente').length;
  const totalPorAgendar = cotizaciones.filter(c => c.estado === 'revisada').length;
  const totalHistorial = cotizaciones.length;

  if (cargando) return <div className="p-8 text-emerald-400 font-black animate-pulse text-center">CARGANDO MESA DE TRABAJO...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">MESA DE <span className="text-emerald-400">TRABAJO</span></h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Gestión de flujo operativo</p>
          </div>
          
          <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 w-full md:w-auto overflow-x-auto scrollbar-hide">
            {['pendiente', 'revisada', 'agendada', 'todos'].map((f) => (
              <button
                key={f}
                onClick={() => setFiltroEstado(f)}
                className={`px-4 py-2 whitespace-nowrap rounded-xl text-[9px] font-black uppercase transition-all ${
                  filtroEstado === f 
                  ? 'bg-emerald-500 text-black shadow-lg' 
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {f === 'revisada' ? 'Por Agendar' : f}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Nuevas Ideas</p>
              <h3 className="text-4xl font-black text-white mt-1">{totalPendientes}</h3>
            </div>
            <div className="text-2xl">💡</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Falta Agendar</p>
              <h3 className="text-4xl font-black text-white mt-1">{totalPorAgendar}</h3>
            </div>
            <div className="text-2xl">📅</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total</p>
              <h3 className="text-4xl font-black text-zinc-400 mt-1">{totalHistorial}</h3>
            </div>
            <div className="text-2xl">📈</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {visibles.length === 0 && (
            <div className="col-span-1 md:col-span-3 text-center py-20 border border-zinc-800 border-dashed rounded-3xl">
              <p className="text-zinc-500 font-black uppercase text-xs">No hay cotizaciones para mostrar</p>
            </div>
          )}
          {visibles.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all flex flex-col">
              <div className="relative h-64 cursor-zoom-in" onClick={() => setFotoFull(getImagenUrl(c.imagen_url))}>
                <img 
                  src={getImagenUrl(c.imagen_url)} 
                  className="w-full h-full object-cover" 
                  alt="Idea" 
                  onError={(e) => { e.target.src = 'https://placehold.co/150x150/18181b/10b981?text=Sin+Foto' }}
                />
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase bg-black/80 text-emerald-400 border border-emerald-500/30">
                  {c.estado}
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col gap-4">
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tighter text-white">{c.cliente}</h3>
                  <p className="text-emerald-500 font-bold text-[10px] uppercase mt-1">
                    {c.zona_cuerpo || 'ZONA N/A'} • {c.tamano_cm || 'TAMAÑO N/A'}
                  </p>
                </div>
                <p className="text-zinc-400 text-xs italic bg-black/30 p-3 rounded-xl">"{c.idea}"</p>
                
                <div className="mt-auto pt-4">
                  {c.estado === 'pendiente' ? (
                    <button onClick={() => setModal({ abierto: true, cot: c })} className="w-full bg-emerald-500 text-black py-3 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-400 transition-colors">EVALUAR DISEÑO</button>
                  ) : c.estado === 'revisada' ? (
                    <button onClick={() => setModalAgenda({ abierto: true, cot: c })} className="w-full bg-blue-500 text-white py-3 rounded-xl font-black text-[10px] uppercase hover:bg-blue-400 transition-colors">AGENDAR HORA DIRECTO</button>
                  ) : (
                    <span className="w-full block text-center text-zinc-600 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase py-3">✓ Agendado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {modal.abierto && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 p-8 rounded-3xl w-full max-w-md space-y-4 border border-emerald-500/30 shadow-2xl text-white">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black text-emerald-400 italic uppercase">Presupuestar</h3>
                <button onClick={() => setModal({ abierto: false, cot: null })} className="text-zinc-600 hover:text-white">✕</button>
              </div>
              <div className="bg-black/50 p-4 rounded-xl text-[10px] space-y-1">
                <p><span className="text-zinc-500 font-black">CLIENTE:</span> {modal.cot?.cliente}</p>
                <p className="text-emerald-400 font-bold border-t border-zinc-800 pt-2 mt-2">
                  <span className="text-zinc-500 font-black">NOTAS:</span> {modal.cot?.notas_medicas || 'Sin notas'}
                </p>
              </div>
              <div className="space-y-3">
                <input placeholder="Precio ($)" type="number" onChange={e => setRespuesta({...respuesta, precio: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                <input placeholder="Horas" type="number" onChange={e => setRespuesta({...respuesta, horas: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                <textarea placeholder="Notas técnicas..." onChange={e => setRespuesta({...respuesta, notas: e.target.value})} className="w-full bg-black border border-zinc-800 p-4 rounded-xl h-20 outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => enviarRespuesta('whatsapp')} className="flex-1 bg-green-500/10 text-green-400 py-3 rounded-xl font-black text-[10px] uppercase border border-green-500/20">WSP & LINK</button>
                <button onClick={() => enviarRespuesta('instagram')} className="flex-1 bg-pink-500/10 text-pink-400 py-3 rounded-xl font-black text-[10px] uppercase border border-pink-500/20">IG & LINK</button>
              </div>
            </div>
          </div>
        )}

        {modalAgenda.abierto && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 text-white">
            <div className="bg-zinc-900 border border-blue-500/30 p-8 rounded-[2rem] w-full max-w-md space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-blue-400 italic uppercase">Agendar Cita</h3>
                <button onClick={() => setModalAgenda({ abierto: false, cot: null })} className="text-zinc-600 hover:text-white font-black text-xl">✕</button>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-white font-bold uppercase">{modalAgenda.cot?.cliente}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400/70 uppercase tracking-widest ml-1">Fecha y Hora</label>
                <div className="relative">
                  <input 
                    type="datetime-local" 
                    min={getFechaMinima()}
                    onClick={(e) => e.target.showPicker()}
                    className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    onChange={(e) => setNuevaCita({ fecha: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button onClick={() => setModalAgenda({ abierto: false, cot: null })} className="bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                <button onClick={confirmarCita} className="bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-500">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {fotoFull && (
          <div onClick={() => setFotoFull(null)} className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[100] cursor-zoom-out">
            <img 
              src={fotoFull} 
              className="max-w-full max-h-[90vh] rounded-2xl object-contain" 
              alt="Full" 
              onError={(e) => { e.target.src = 'https://placehold.co/150x150/18181b/10b981?text=Sin+Foto' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Calendario() {
  const [citas, setCitas] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [fechaBase, setFechaBase] = useState(new Date()); 
  
  const [modalReagendar, setModalReagendar] = useState({ abierto: false, cita: null });
  const [nuevaFecha, setNuevaFecha] = useState('');
  
  const navigate = useNavigate();

  const getFechaMinima = () => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
  };

  const cargarCitas = async () => {
    try {
      const res = await axios.get('/citas/mis-citas');
      setCitas(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  useEffect(() => {
    cargarCitas();
  }, [navigate]);

  const anio = fechaBase.getFullYear();
  const mes = fechaBase.getMonth(); 

  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const diasMes = new Date(anio, mes + 1, 0).getDate();

  const espaciosVacios = Array.from({ length: primerDiaSemana }, (_, i) => i);
  const dias = Array.from({ length: diasMes }, (_, i) => i + 1);

  // FILTRO: Oculta las citas completadas
  const getCitasDelDia = (diaBuscado) => {
    return citas.filter(c => {
      if (!c.fecha_inicio) return false;
      if (c.cotizacion?.estado === 'completada' || c.estado === 'completada') return false;
      
      const f = new Date(c.fecha_inicio);
      return f.getFullYear() === anio && f.getMonth() === mes && f.getDate() === diaBuscado;
    });
  };

  const cambiarMes = (direccion) => {
    setFechaBase(new Date(anio, mes + direccion, 1));
    setDiaSeleccionado(null); 
  };

  // FUNCIÓN: Completar Cita y enviar WhatsApp
  const finalizarCita = async (citaId) => {
    if (!window.confirm("🏁 ¿Confirmas que esta sesión de tatuaje ha finalizado? Se removerá del calendario activo y se prepararán los cuidados.")) return;
    
    try {
      const res = await axios.patch(`/citas/${citaId}/completar`);
      alert("✅ Cita marcada como completada.");
      
      if (res.data.telefono) {
        const urlWsp = `https://wa.me/${res.data.telefono.replace(/\+/g,'')}?text=${encodeURIComponent(res.data.texto_cuidados)}`;
        window.open(urlWsp, '_blank');
      }
      
      cargarCitas(); 
      setDiaSeleccionado(null); 
    } catch (error) {
      alert("Error al finalizar la cita.");
    }
  };

  const confirmarReagendamiento = async () => {
    if (!nuevaFecha) return alert("Por favor selecciona una nueva fecha y hora.");
    const fechaObj = new Date(nuevaFecha);
    if (fechaObj < new Date()) return alert("❌ Error: No puedes agendar en el pasado.");
    
    try {
      const inicio = new Date(nuevaFecha);
      const horas = modalReagendar.cita.cotizacion?.tiempo_estimado_hrs || 3;
      const fin = new Date(inicio.getTime() + (horas * 60 * 60 * 1000));
      
      await axios.put(`/citas/${modalReagendar.cita.id}`, {
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString()
      });
      
      alert("✅ Cita reagendada con éxito");
      setModalReagendar({ abierto: false, cita: null });
      setNuevaFecha('');
      cargarCitas(); 
    } catch (err) {
      alert("Error al reagendar la cita en el servidor.");
    }
  };

  const eliminarCita = async (citaId) => {
    if (!window.confirm("🚨 ¿Estás seguro de que deseas cancelar y eliminar esta cita del calendario?")) return;
    
    try {
      await axios.delete(`/citas/${citaId}`);
      alert("✅ Cita eliminada correctamente");
      cargarCitas(); 
    } catch (error) {
      alert("Error al eliminar la cita.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-zinc-800 pb-6 gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6">
            <button onClick={() => cambiarMes(-1)} className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center font-black text-zinc-500 hover:text-emerald-400 hover:border-emerald-500 transition-all shadow-lg text-lg md:text-xl">
              {"<"}
            </button>
            <h2 className="text-2xl md:text-4xl font-black italic text-emerald-400 uppercase tracking-tighter min-w-[200px] md:min-w-[320px] text-center">
              {fechaBase.toLocaleString('es-CL', { month: 'long', year: 'numeric' }).toUpperCase()}
            </h2>
            <button onClick={() => cambiarMes(1)} className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center font-black text-zinc-500 hover:text-emerald-400 hover:border-emerald-500 transition-all shadow-lg text-lg md:text-xl">
              {">"}
            </button>
          </div>
          <Link to="/admin" className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-[10px] font-black hover:text-emerald-400 transition-all uppercase w-full md:w-auto text-center">
            VOLVER A MESA
          </Link>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          <div className={`grid grid-cols-7 gap-1 md:gap-4 transition-all duration-500 ${diaSeleccionado ? 'w-full md:w-2/3' : 'w-full'}`}>
            {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
              <div key={d} className="text-center text-[10px] md:text-xs font-black text-zinc-600 mb-1 md:mb-2 uppercase tracking-widest">
                {d}
              </div>
            ))}
            
            {espaciosVacios.map(e => (
              <div key={`v-${e}`} className="min-h-[60px] md:min-h-[100px] opacity-10"></div>
            ))}
            
            {dias.map(dia => {
              const citasHoy = getCitasDelDia(dia);
              const esHoy = diaSeleccionado === dia;

              return (
                <div 
                  key={dia} 
                  onClick={() => setDiaSeleccionado(dia)}
                  className={`cursor-pointer min-h-[60px] md:min-h-[100px] p-1 md:p-3 rounded-xl md:rounded-2xl border transition-all flex flex-col ${
                    esHoy ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span className={`text-[10px] md:text-xs font-black ${esHoy ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {dia}
                  </span>
                  <div className="mt-auto flex justify-center flex-wrap gap-1">
                    {citasHoy.map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {diaSeleccionado && (
            <div className="w-full md:w-1/3 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 animate-in slide-in-from-right md:slide-in-from-right-8 duration-300 flex flex-col h-fit md:sticky md:top-8 mt-6 md:mt-0">
              <div className="flex justify-between items-start mb-6 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">DÍA {diaSeleccionado}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Citas Programadas</p>
                </div>
                <button 
                  onClick={() => setDiaSeleccionado(null)} 
                  className="bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-400 w-8 h-8 rounded-full flex items-center justify-center transition-colors font-black"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                {(() => {
                  const citasDelDia = getCitasDelDia(diaSeleccionado);

                  if (citasDelDia.length === 0) {
                    return (
                      <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">No hay citas en esta fecha</p>
                      </div>
                    );
                  }

                  return citasDelDia.map((cita) => {
                    const fechaObj = new Date(cita.fecha_inicio);
                    const horaFormateada = fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });

                    const cliente = cita.cliente || cita.cotizacion?.cliente || 'Cliente Anónimo';
                    const zona = cita.zona_cuerpo || cita.cotizacion?.zona_cuerpo || 'ZONA N/A';
                    const tamano = cita.tamano_cm || cita.cotizacion?.tamano_cm || 'TAMAÑO N/A';
                    const idea = cita.idea || cita.cotizacion?.descripcion_idea || cita.cotizacion?.idea || 'Sin descripción técnica';
                    const fotoUrl = getImagenUrl(cita.imagen_url || cita.cotizacion?.imagen_url);

                    return (
                      <div key={cita.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 hover:border-emerald-500/50 transition-all shadow-lg group">
                        <div className="w-full md:w-20 h-32 md:h-20 flex-shrink-0 relative overflow-hidden rounded-xl border border-zinc-800">
                          <img 
                            src={fotoUrl} 
                            alt="Referencia" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                            onError={(e) => { e.target.src = 'https://placehold.co/150x150/18181b/10b981?text=Sin+Foto' }}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center overflow-hidden">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-white font-black uppercase text-sm tracking-tighter truncate pr-2">
                              {cliente}
                            </h4>
                            <span className="bg-zinc-900 border border-zinc-800 text-emerald-400 px-2 py-1 rounded-lg text-[9px] font-black tracking-widest whitespace-nowrap shadow-inner">
                              {horaFormateada}
                            </span>
                          </div>
                          <p className="text-emerald-500 font-bold text-[9px] uppercase tracking-widest">
                            {zona} • {tamano}
                          </p>
                          <p className="text-zinc-500 text-[10px] italic mt-2 line-clamp-2 bg-black/40 p-2 rounded-lg border border-zinc-800/50 leading-relaxed">
                            "{idea}"
                          </p>

                          <div className="mt-3 flex flex-col gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); finalizarCita(cita.id); }}
                              className="w-full bg-emerald-500 text-black py-2.5 rounded-xl font-black text-[10px] uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
                            >
                              ✅ Terminar Sesión y Enviar Cuidados
                            </button>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setModalReagendar({ abierto: true, cita: cita }); }}
                                className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 text-zinc-500 py-2 rounded-xl font-black text-[9px] uppercase transition-colors"
                              >
                                Reprogramar
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); eliminarCita(cita.id); }}
                                className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-red-500 hover:text-red-400 text-zinc-500 py-2 rounded-xl font-black text-[9px] uppercase transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {modalReagendar.abierto && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[60] text-white">
            <div className="bg-zinc-900 border border-emerald-500/30 p-8 rounded-[2rem] w-full max-w-md space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-emerald-400 italic uppercase">Reprogramar</h3>
                <button onClick={() => setModalReagendar({ abierto: false, cita: null })} className="text-zinc-600 hover:text-white font-black text-xl">✕</button>
              </div>
              
              <div className="bg-black/40 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Cliente actual</p>
                <p className="text-white font-bold uppercase">{modalReagendar.cita.cotizacion?.cliente || 'Anónimo'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest ml-1">Nueva Fecha y Hora</label>
                <div className="relative">
                  <input 
                    type="datetime-local" 
                    min={getFechaMinima()}
                    onClick={(e) => e.target.showPicker()}
                    className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                    onChange={(e) => setNuevaFecha(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button onClick={() => setModalReagendar({ abierto: false, cita: null })} className="bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                <button onClick={confirmarReagendamiento} className="bg-emerald-600 text-black py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-500">Confirmar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// PANTALLA MÁGICA PARA EL CLIENTE (PORTAL DE RESERVA)
// -------------------------------------------------------------------------
function PortalCliente() {
  const { id } = useParams();
  const [cot, setCot] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [horaSel, setHoraSel] = useState('');
  const [buscandoHoras, setBuscandoHoras] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await axios.get(`/citas/portal-cliente/${id}`);
        setCot(res.data);
      } catch (err) {
        setError('Este link es inválido o la cotización ya fue agendada.');
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [id]);

  useEffect(() => {
    if (!fechaSeleccionada) return;
    const buscarHoras = async () => {
      setBuscandoHoras(true);
      setHoraSel('');
      try {
        const res = await axios.get(`/citas/disponibilidad/${fechaSeleccionada}`);
        setHorasDisponibles(res.data.horas_disponibles);
      } catch (err) {
        setHorasDisponibles([]);
      } finally {
        setBuscandoHoras(false);
      }
    };
    buscarHoras();
  }, [fechaSeleccionada]);

  const confirmarCita = async () => {
    if (!fechaSeleccionada || !horaSel) return alert('Selecciona una hora disponible');
    setAgendando(true);
    try {
      const inicio = new Date(`${fechaSeleccionada}T${horaSel}:00`);
      const fin = new Date(inicio.getTime() + (cot.tiempo_estimado_hrs * 60 * 60 * 1000));

      await axios.post('/citas/', {
        cotizacion_id: id,
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString()
      });

      setExito(true);
    } catch (err) {
      alert('Error al agendar. Es posible que alguien más haya tomado este horario recién.');
    } finally {
      setAgendando(false);
    }
  };

  if (cargando) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-400 font-black animate-pulse">CARGANDO RESERVA...</div>;
  if (error) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500 font-black uppercase">{error}</div>;
  if (exito) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="text-8xl mb-6">✅</div>
      <h2 className="text-4xl font-black text-emerald-400 italic uppercase tracking-tighter text-center">¡SESIÓN AGENDADA!</h2>
      <p className="text-zinc-400 mt-4 max-w-sm text-center">Tu hora ha sido confirmada en el calendario del estudio. Te esperamos.</p>
    </div>
  );

  const hoyStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        <div className="w-full md:w-1/2 p-8 md:p-12 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Presupuesto Aprobado</p>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">{cot.cliente}</h2>
          
          <div className="mt-8 relative rounded-2xl overflow-hidden border border-zinc-800 aspect-square">
            <img 
              src={getImagenUrl(cot.imagen_url)} 
              alt="Diseño" 
              className="w-full h-full object-cover" 
              onError={(e) => { e.target.src = 'https://placehold.co/150x150/18181b/10b981?text=Sin+Foto' }}
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-6 pt-12">
              <p className="text-emerald-400 font-black text-2xl">${Number(cot.precio_estimado).toLocaleString('es-CL')}</p>
              <p className="text-white font-bold text-xs uppercase mt-1">{cot.tiempo_estimado_hrs} Horas de Sesión</p>
            </div>
          </div>

          <div className="mt-6 bg-black/40 p-4 rounded-2xl">
            <p className="text-zinc-500 text-[10px] italic">"{cot.idea}"</p>
            <p className="text-zinc-400 text-[10px] uppercase font-black mt-3">{cot.zona_cuerpo} • {cot.tamano_cm}</p>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
          <h3 className="text-2xl font-black text-emerald-400 italic uppercase tracking-tighter mb-8">Elige tu horario</h3>
          
          {cot.estado === 'agendada' ? (
             <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 rounded-2xl border border-zinc-800 p-8 text-center">
               <span className="text-4xl mb-2">📅</span>
               <p className="text-zinc-400 font-bold uppercase text-xs">Esta sesión ya tiene fecha</p>
             </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">1. Selecciona un día</label>
                <input 
                  type="date" 
                  min={hoyStr}
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-emerald-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              <div className="mb-8 flex-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">2. Horas disponibles</label>
                
                {!fechaSeleccionada ? (
                  <div className="text-center py-10 bg-zinc-950 rounded-xl border border-dashed border-zinc-800 text-zinc-600 text-xs font-bold uppercase">
                    Elige un día primero
                  </div>
                ) : buscandoHoras ? (
                  <div className="text-center py-10 text-emerald-500 text-xs font-black uppercase animate-pulse">Calculando espacios...</div>
                ) : horasDisponibles.length === 0 ? (
                  <div className="text-center py-10 bg-red-500/10 rounded-xl border border-dashed border-red-500/30 text-red-400 text-xs font-bold uppercase">
                    Agenda llena este día
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {horasDisponibles.map((h) => (
                      <button 
                        key={h}
                        onClick={() => setHoraSel(h)}
                        className={`py-3 rounded-xl font-black text-sm transition-all ${horaSel === h ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105' : 'bg-black border border-zinc-800 text-zinc-400 hover:border-emerald-500 hover:text-emerald-400'}`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={confirmarCita}
                disabled={!horaSel || agendando}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${!horaSel ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-emerald-500 text-black shadow-lg hover:scale-[1.02]'}`}
              >
                {agendando ? 'Confirmando...' : 'CONFIRMAR RESERVA'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 7. RUTAS PRINCIPALES Y EXPORT POR DEFECTO
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cotizar" element={<Formulario />} />
        <Route path="/reserva/:id" element={<PortalCliente />} />
        <Route path="/admin" element={<RutaProtegida><Sidebar><AdminPanel /></Sidebar></RutaProtegida>} />
        <Route path="/calendario" element={<RutaProtegida><Sidebar><Calendario /></Sidebar></RutaProtegida>} />
      </Routes>
    </BrowserRouter>
  )
}