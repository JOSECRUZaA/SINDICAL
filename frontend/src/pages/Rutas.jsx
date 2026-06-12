import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Map, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored markers
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to catch map clicks
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

const Rutas = () => {
  const { profile } = useAuth();
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewRouteMode, setViewRouteMode] = useState(false); // To just view a route without editing
  
  const [selectingPoint, setSelectingPoint] = useState('origen'); // 'origen' or 'destino'
  const [routeCoordinates, setRouteCoordinates] = useState([]); // Array of [lat, lng] for OSRM route

  const defaultFormData = {
    numero_ruta: '', nombre_ruta: '', origen: '', destino: '',
    origen_lat: '', origen_lng: '',
    destino_lat: '', destino_lng: ''
  };
  const [formData, setFormData] = useState(defaultFormData);

  // La Paz default coordinates
  const defaultCenter = [-16.5000, -68.1500];

  // Fetch OSRM route when coordinates change
  useEffect(() => {
    const fetchRoute = async () => {
      const { origen_lat, origen_lng, destino_lat, destino_lng } = formData;
      // Make sure all coordinates exist and are numbers
      if (origen_lat && origen_lng && destino_lat && destino_lng && 
          !isNaN(origen_lat) && !isNaN(origen_lng) && !isNaN(destino_lat) && !isNaN(destino_lng)) {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${origen_lng},${origen_lat};${destino_lng},${destino_lat}?geometries=geojson`;
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            // OSRM returns coordinates as [lng, lat], Leaflet needs [lat, lng]
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRouteCoordinates(coords);
          }
        } catch (error) {
          console.error("Error fetching route from OSRM:", error);
          setRouteCoordinates([]);
        }
      } else {
        setRouteCoordinates([]);
      }
    };
    
    // Debounce slightly to avoid spamming API while typing
    const timeoutId = setTimeout(() => {
      fetchRoute();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.origen_lat, formData.origen_lng, formData.destino_lat, formData.destino_lng]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('rutas').select('*').order('id_ruta');
    if (!error) setRutas(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewRouteMode) {
        setShowModal(false);
        return;
    }
    const { error } = await supabase.from('rutas').insert([formData]);
    if (!error) {
      setShowModal(false);
      setFormData(defaultFormData);
      fetchData();
    } else alert('Error: ' + error.message);
  };

  const handleDelete = async (id_ruta) => {
    if (window.confirm('¿Está seguro que desea eliminar esta ruta? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase.from('rutas').delete().eq('id_ruta', id_ruta);
        if (error) throw error;
        fetchData();
      } catch (error) {
        alert('Error al eliminar ruta: ' + error.message);
      }
    }
  };

  const handleMapClick = (latlng) => {
    if (viewRouteMode) return; // Disallow edits if just viewing
    
    if (selectingPoint === 'origen') {
      setFormData({ ...formData, origen_lat: latlng.lat.toFixed(6), origen_lng: latlng.lng.toFixed(6) });
      setSelectingPoint('destino');
    } else {
      setFormData({ ...formData, destino_lat: latlng.lat.toFixed(6), destino_lng: latlng.lng.toFixed(6) });
      setSelectingPoint('origen');
    }
  };

  const openViewModal = (ruta) => {
      setFormData({
        ...ruta,
        origen_lat: ruta.origen_lat || '', origen_lng: ruta.origen_lng || '',
        destino_lat: ruta.destino_lat || '', destino_lng: ruta.destino_lng || ''
      });
      setViewRouteMode(true);
      setShowModal(true);
  };

  const openNewRouteModal = () => {
      setFormData(defaultFormData);
      setViewRouteMode(false);
      setRouteCoordinates([]);
      setSelectingPoint('origen');
      setShowModal(true);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestión de Rutas</h2>
          <p className="text-muted">Administración de recorridos y líneas.</p>
        </div>
        <button className="btn btn-primary" onClick={openNewRouteModal}>
          <Plus size={18} /> Nueva Ruta
        </button>
      </div>

      <div className="glass-table-container">
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div> : (
            <table>
              <thead>
                <tr>
                  <th>Nº Línea</th>
                  <th>Nombre Comercial</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Estado</th>
                  <th>Mapa</th>
                </tr>
              </thead>
              <tbody>
                {rutas.map(r => (
                  <tr key={r.id_ruta}>
                    <td className="font-medium text-white">{r.numero_ruta}</td>
                    <td>{r.nombre_ruta}</td>
                    <td>{r.origen}</td>
                    <td>{r.destino}</td>
                    <td><span className={`badge ${r.estado === 1 ? 'badge-success' : 'badge-danger'}`}>
                      {r.estado === 1 ? 'Activa' : 'Inactiva'}
                    </span></td>
                      <button 
                        className="btn btn-icon" 
                        title="Ver en Mapa"
                        onClick={() => openViewModal(r)}
                        style={{background: 'rgba(0,0,0,0.05)', color: 'var(--primary-color)'}}
                      >
                        <Map size={18} />
                      </button>
                      {profile?.rol === 'Administrador' && (
                        <button 
                          className="btn-outline" 
                          style={{padding: '0.25rem 0.5rem', border: 'none', color: 'var(--danger-color)', marginLeft: '0.25rem'}} 
                          title="Eliminar"
                          onClick={() => handleDelete(r.id_ruta)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '900px'}}>
            <div className="modal-header">
              <h3 className="modal-title">{viewRouteMode ? 'Detalle de la Ruta' : 'Registrar Ruta con Mapa'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '85vh' }}>
              <div className="modal-body custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start', overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
                
                {/* Formulario Izquierdo */}
                <div className="flex-col gap-4">
                  <div className="form-group">
                    <label className="form-label">Número/Código de Línea</label>
                    <input type="text" required value={formData.numero_ruta} readOnly={viewRouteMode} onChange={e => setFormData({...formData, numero_ruta: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre Comercial</label>
                    <input type="text" value={formData.nombre_ruta} readOnly={viewRouteMode} onChange={e => setFormData({...formData, nombre_ruta: e.target.value})} />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      Punto de Origen (Verde)
                      {!viewRouteMode && <button type="button" onClick={() => setSelectingPoint('origen')} style={{ border: 'none', background: 'none', color: selectingPoint === 'origen' ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: selectingPoint === 'origen' ? 'bold' : 'normal' }}>Seleccionar</button>}
                    </label>
                    <input type="text" required placeholder="Nombre de lugar. Ej: Ceja El Alto" value={formData.origen} readOnly={viewRouteMode} onChange={e => setFormData({...formData, origen: e.target.value})} style={{marginBottom: '0.5rem'}} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input type="number" step="any" placeholder="Latitud" value={formData.origen_lat} readOnly={viewRouteMode} onChange={e => setFormData({...formData, origen_lat: e.target.value})} style={{fontSize: '0.85rem', padding: '0.5rem'}} />
                        <input type="number" step="any" placeholder="Longitud" value={formData.origen_lng} readOnly={viewRouteMode} onChange={e => setFormData({...formData, origen_lng: e.target.value})} style={{fontSize: '0.85rem', padding: '0.5rem'}} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      Punto de Destino (Rojo)
                      {!viewRouteMode && <button type="button" onClick={() => setSelectingPoint('destino')} style={{ border: 'none', background: 'none', color: selectingPoint === 'destino' ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: selectingPoint === 'destino' ? 'bold' : 'normal' }}>Seleccionar</button>}
                    </label>
                    <input type="text" required placeholder="Nombre de lugar. Ej: Plaza Murillo" value={formData.destino} readOnly={viewRouteMode} onChange={e => setFormData({...formData, destino: e.target.value})} style={{marginBottom: '0.5rem'}} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input type="number" step="any" placeholder="Latitud" value={formData.destino_lat} readOnly={viewRouteMode} onChange={e => setFormData({...formData, destino_lat: e.target.value})} style={{fontSize: '0.85rem', padding: '0.5rem'}} />
                        <input type="number" step="any" placeholder="Longitud" value={formData.destino_lng} readOnly={viewRouteMode} onChange={e => setFormData({...formData, destino_lng: e.target.value})} style={{fontSize: '0.85rem', padding: '0.5rem'}} />
                    </div>
                  </div>

                  {!viewRouteMode && (
                      <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1rem', borderRadius: '0.5rem', color: 'var(--secondary-color)', fontSize: '0.85rem' }}>
                          <strong>Instrucciones:</strong> Haz clic en el mapa para marcar el {selectingPoint === 'origen' ? 'Origen (Punto Inicial)' : 'Destino (Punto Final)'}.
                      </div>
                  )}
                </div>

                {/* Mapa Derecho */}
                <div style={{ height: '400px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <MapContainer center={formData.origen_lat && !isNaN(formData.origen_lat) ? [formData.origen_lat, formData.origen_lng] : defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents onMapClick={handleMapClick} />
                    
                    {formData.origen_lat && formData.origen_lng && !isNaN(formData.origen_lat) && (
                      <Marker position={[formData.origen_lat, formData.origen_lng]} icon={greenIcon}>
                        <Popup>Origen: {formData.origen}</Popup>
                      </Marker>
                    )}
                    
                    {formData.destino_lat && formData.destino_lng && !isNaN(formData.destino_lat) && (
                      <Marker position={[formData.destino_lat, formData.destino_lng]} icon={redIcon}>
                        <Popup>Destino: {formData.destino}</Popup>
                      </Marker>
                    )}

                    {/* Ruta real por calles usando OSRM */}
                    {routeCoordinates.length > 0 ? (
                        <Polyline 
                            positions={routeCoordinates}
                            color="var(--primary-color)"
                            weight={4}
                            opacity={0.8}
                        />
                    ) : (
                      /* Fallback a línea recta segmentada si no hay datos de ruta real */
                      formData.origen_lat && formData.destino_lat && !isNaN(formData.origen_lat) && !isNaN(formData.destino_lat) && (
                          <Polyline 
                              positions={[
                                  [formData.origen_lat, formData.origen_lng],
                                  [formData.destino_lat, formData.destino_lng]
                              ]}
                              color="var(--text-muted)"
                              weight={3}
                              dashArray="10, 10"
                          />
                      )
                    )}
                  </MapContainer>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cerrar</button>
                {!viewRouteMode && <button type="submit" className="btn btn-primary">Guardar Ruta</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Rutas;
