'use client';

import { FiCheck, FiX } from 'react-icons/fi';

interface PasswordRequisitosProps {
  password: string;
  visible: boolean;
}

interface Requisito {
  label: string;
  test: (password: string) => boolean;
}

const requisitos: Requisito[] = [
  {
    label: 'Mínimo 8 caracteres',
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: 'Al menos una mayúscula',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: 'Al menos una minúscula',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: 'Al menos un número',
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    label: 'Al menos un carácter especial (!@#$%^&*...)',
    test: (pwd) => /[!@#$%^&*(),.?":{}|<>\-+=\[\]_]/.test(pwd),
  },
];

export default function PasswordRequisitos({ password, visible }: PasswordRequisitosProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        fontSize: '0.85rem',
        marginTop: '0.5rem',
        padding: '0.75rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '0.375rem',
        border: '1px solid #dee2e6',
      }}
    >
      <p
        style={{
          marginBottom: '0.5rem',
          fontWeight: 600,
          color: '#495057',
        }}
      >
        Requisitos de la contraseña:
      </p>
      {requisitos.map((requisito, index) => {
        const cumple = requisito.test(password);
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem',
              color: cumple ? '#198754' : '#6c757d',
            }}
          >
            {cumple ? <FiCheck size={16} /> : <FiX size={16} />}
            <span style={{ textDecoration: cumple ? 'line-through' : 'none' }}>
              {requisito.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
