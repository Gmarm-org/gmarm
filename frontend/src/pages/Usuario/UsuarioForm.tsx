import React, { useState } from 'react';

// Simulación de datos de usuario (esto vendría de la API)
const usuarioEjemplo = {
  username: 'jdoe',
  email: 'jdoe@email.com',
  nombres: 'Juan',
  apellidos: 'Doe',
  foto: '',
  telefono_principal: '0999999999',
  telefono_secundario: '',
  direccion: 'Calle Principal 123',
  fecha_creacion: '2023-01-01T10:00:00Z',
  ultimo_login: '2023-06-01T15:30:00Z',
};

const UsuarioForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [form, setForm] = useState(usuarioEjemplo);
  const [fotoPreview, setFotoPreview] = useState(form.foto);
  const [errorTel, setErrorTel] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [errorPass, setErrorPass] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'foto' && files && files[0]) {
      setForm(f => ({ ...f, foto: files[0].name }));
      setFotoPreview(URL.createObjectURL(files[0]));
    } else if (name === 'telefono_principal' || name === 'telefono_secundario') {
      if (value && !/^\d{0,10}$/.test(value)) return;
      setForm(f => ({ ...f, [name]: value }));
      if (name === 'telefono_principal' && value.length > 0 && value.length < 10) {
        setErrorTel('El teléfono debe tener 10 dígitos');
      } else {
        setErrorTel('');
      }
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'password') setPassword(value);
    if (name === 'password2') setPassword2(value);
    if (name === 'password2' && value !== password) {
      setErrorPass('Las contraseñas no coinciden');
    } else {
      setErrorPass('');
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errorTel || errorPass) return;
    // Aquí iría la llamada a la API para actualizar
    alert('Datos actualizados (simulado)');
  };

  return (
    <div className="user-section">
      <button className="action-btn secondary" style={{ marginBottom: 16 }} onClick={onBack}>
        ← Volver
      </button>
      <h2>Editar perfil de usuario</h2>
      <form style={{ maxWidth: 400 }} onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Usuario:</label>
          <input type="text" value={form.username} readOnly />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={form.email} readOnly />
          <small style={{ color: '#ef4444' }}>El correo solo puede ser cambiado por el administrador.</small>
        </div>
        <div className="form-group">
          <label>Nombres:</label>
          <input type="text" name="nombres" value={form.nombres} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Apellidos:</label>
          <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Teléfono principal:</label>
          <input type="tel" name="telefono_principal" value={form.telefono_principal} onChange={handleChange} required maxLength={10} />
          {errorTel && <small style={{ color: '#ef4444' }}>{errorTel}</small>}
        </div>
        <div className="form-group">
          <label>Teléfono secundario:</label>
          <input type="tel" name="telefono_secundario" value={form.telefono_secundario} onChange={handleChange} maxLength={10} />
        </div>
        <div className="form-group">
          <label>Dirección:</label>
          <input type="text" name="direccion" value={form.direccion} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Foto de perfil:</label>
          <input type="file" name="foto" accept="image/*" onChange={handleChange} />
          {fotoPreview && <img src={fotoPreview} alt="Foto de perfil" style={{ width: 80, height: 80, borderRadius: '50%', marginTop: 8, objectFit: 'cover' }} />}
        </div>
        <div className="form-group">
          <label>Fecha de creación:</label>
          <input type="text" value={formatDate(form.fecha_creacion)} readOnly />
        </div>
        <div className="form-group">
          <label>Último login:</label>
          <input type="text" value={formatDate(form.ultimo_login)} readOnly />
        </div>
        <hr style={{ margin: '24px 0' }} />
        <h3>Cambiar contraseña</h3>
        <div className="form-group">
          <label>Nueva contraseña:</label>
          <input type="password" name="password" value={password} onChange={handlePasswordChange} minLength={6} />
        </div>
        <div className="form-group">
          <label>Repetir nueva contraseña:</label>
          <input type="password" name="password2" value={password2} onChange={handlePasswordChange} minLength={6} />
          {errorPass && <small style={{ color: '#ef4444' }}>{errorPass}</small>}
        </div>
        <button className="submit-btn" type="submit" disabled={!!errorTel || !!errorPass}>Guardar cambios</button>
      </form>
    </div>
  );
};

export default UsuarioForm; 