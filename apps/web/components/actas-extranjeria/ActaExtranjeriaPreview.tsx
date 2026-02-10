'use client';

import React from 'react';
import type { ActaExtranjeria, Profesor, Pais } from '@/types';

interface ActaExtranjeriaPreviewProps {
  acta: ActaExtranjeria & {
    profesor?: Profesor;
    paisDestino?: Pais;
  };
}

const CheckBox = ({ checked }: { checked?: boolean }) => (
  <span
    style={{
      display: 'inline-block',
      width: '10px',
      height: '10px',
      border: '1px solid black',
      marginRight: '2px',
      verticalAlign: 'middle',
    }}
  >
    {checked ? '✓' : ''}
  </span>
);

export const ActaExtranjeriaPreview: React.FC<ActaExtranjeriaPreviewProps> = ({
  acta,
}) => {
  const fechaActa = new Date(acta.fechaActa);
  const dia = String(fechaActa.getDate()).padStart(2, '0');
  const mes = String(fechaActa.getMonth() + 1).padStart(2, '0');
  const ano = fechaActa.getFullYear();

  return (
    <div className="acta-extranjeria-preview">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
        }

        .acta-extranjeria-preview {
          width: 100%;
          background-color: white;
          padding: 16px;
          margin: 0;
        }

        .acta-extranjeria-preview .acta-container {
          font-family: Arial, sans-serif;
          font-size: 8pt;
          line-height: 1.1;
          color: #000000;
          border: 2px solid #000000;
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          padding: 0;
        }

        .acta-extranjeria-preview .acta-header {
          text-align: center;
          border-bottom: 1px solid #000000;
          padding: 6px 2px;
        }

        .acta-extranjeria-preview .acta-header h1 {
          font-weight: bold;
          font-size: 9pt;
          margin: 0 0 1px 0;
          padding: 0;
        }

        .acta-extranjeria-preview .acta-header h2 {
          font-weight: bold;
          font-size: 8pt;
          margin: 1px 0;
          padding: 0;
        }

        .acta-extranjeria-preview .acta-header h3 {
          font-weight: bold;
          font-size: 8pt;
          margin: 0;
          padding: 0;
        }

        .acta-extranjeria-preview .row {
          display: flex;
          border-bottom: 1px solid #000000;
        }

        .acta-extranjeria-preview .row-fecha {
          display: flex;
          border-bottom: 1px solid #000000;
          min-height: 50px;
        }

        .acta-extranjeria-preview .row-solicitud {
          display: flex;
          border-bottom: 1px solid #000000;
          min-height: 80px;
        }

        .acta-extranjeria-preview .cell {
          border-right: 1px solid #000000;
          padding: 4px 2px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .acta-extranjeria-preview .cell-last {
          border-right: none;
        }

        .acta-extranjeria-preview .cell-label {
          font-weight: bold;
          font-size: 7pt;
          margin-bottom: 2px;
        }

        .acta-extranjeria-preview .cell-value {
          text-align: center;
          font-weight: bold;
        }

        .acta-extranjeria-preview .flex-1 {
          flex: 1;
        }

        .acta-extranjeria-preview .flex-row {
          display: flex;
          flex: 1;
        }

        .acta-extranjeria-preview .flex-col {
          display: flex;
          flex-direction: column;
        }

        .acta-extranjeria-preview .fecha-label {
          border-right: 1px solid #000000;
          padding: 2px 1px;
          font-weight: bold;
          font-size: 6pt;
          font-style: italic;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 18px;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }

        .acta-extranjeria-preview .fecha-contenido {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .acta-extranjeria-preview .salida-entrada {
          display: flex;
          border-bottom: 1px solid #000000;
          flex: 1;
        }

        .acta-extranjeria-preview .salida-cell {
          flex: 1;
          border-right: 1px solid #000000;
          padding: 2px 2px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .entrada-cell {
          flex: 1;
          padding: 2px 2px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .dia-mes-ano {
          display: flex;
          flex: 1;
        }

        .acta-extranjeria-preview .dia-cell {
          flex: 0.4;
          border-right: 1px solid #000000;
          text-align: center;
          padding: 2px 1px;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .mes-cell {
          flex: 0.35;
          border-right: 1px solid #000000;
          text-align: center;
          padding: 2px 1px;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .ano-cell {
          flex: 0.25;
          text-align: center;
          padding: 2px 1px;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .date-label {
          font-size: 6pt;
          font-weight: bold;
          margin-bottom: 1px;
        }

        .acta-extranjeria-preview .date-value {
          font-weight: bold;
        }

        .acta-extranjeria-preview .no-acta-cell {
          border-left: 1px solid #000000;
          padding: 2px;
          min-width: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .no-acta-label {
          font-weight: bold;
          font-size: 6pt;
        }

        .acta-extranjeria-preview .no-acta-value {
          font-family: monospace;
          font-weight: bold;
          margin-top: 2px;
        }

        .acta-extranjeria-preview .solicitud-label {
          border-right: 1px solid #000000;
          padding: 4px 2px;
          font-weight: bold;
          font-size: 7pt;
          width: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .acta-extranjeria-preview .solicitud-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 2fr;
          grid-template-rows: auto auto auto auto;
        }

        .acta-extranjeria-preview .solicitud-tipo {
          border-right: 1px solid #000000;
          border-bottom: 1px solid #000000;
          padding: 2px;
          font-weight: bold;
          font-size: 6pt;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .acta-extranjeria-preview .solicitud-tipo-last {
          border-right: 1px solid #000000;
          padding: 2px;
          font-weight: bold;
          font-size: 6pt;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .acta-extranjeria-preview .solicitud-opciones {
          border-bottom: 1px solid #000000;
          padding: 2px;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .solicitud-opciones-last {
          padding: 2px;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .opcion {
          margin: 1px 0;
        }

        .acta-extranjeria-preview .tabla-datos {
          border-bottom: 1px solid #000000;
        }

        .acta-extranjeria-preview .tabla-header {
          display: flex;
          border-bottom: 1px solid #000000;
          font-weight: bold;
        }

        .acta-extranjeria-preview .tabla-fila {
          display: flex;
          border-bottom: 1px solid #000000;
          min-height: 18px;
        }

        .acta-extranjeria-preview .tabla-fila-primera {
          display: flex;
          border-bottom: 1px solid #000000;
          min-height: 20px;
        }

        .acta-extranjeria-preview .tabla-no {
          width: 20px;
          border-right: 1px solid #000000;
          padding: 2px;
          text-align: center;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .tabla-nombres {
          flex: 1;
          border-right: 1px solid #000000;
          padding: 2px;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .tabla-ciudadania {
          width: 50px;
          border-right: 1px solid #000000;
          padding: 2px;
          text-align: center;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .tabla-importe {
          width: 50px;
          padding: 2px;
          text-align: center;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .footer {
          padding: 4px 2px;
          text-align: center;
          font-size: 7pt;
        }

        .acta-extranjeria-preview .footer-pais {
          font-style: italic;
          margin-bottom: 2px;
        }

        .acta-extranjeria-preview .footer-funcion {
          font-weight: bold;
          font-size: 8pt;
        }

        @media print {
          .acta-extranjeria-preview {
            width: 100%;
            height: 100%;
            padding: 0 !important;
            margin: 0;
            background-color: white !important;
          }

          .acta-extranjeria-preview .acta-container {
            border: 2px solid #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
            max-width: 100%;
            page-break-after: avoid;
          }

          .acta-extranjeria-preview .row,
          .acta-extranjeria-preview .row-fecha,
          .acta-extranjeria-preview .row-solicitud {
            page-break-inside: avoid;
          }

          .acta-extranjeria-preview * {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="acta-container">
        {/* ENCABEZADO */}
        <div className="acta-header">
          <h1>REPÚBLICA DE CUBA</h1>
          <h2>MINISTERIO DEL INTERIOR</h2>
          <h3>DIRECCIÓN DE INMIGRACIÓN Y EXTRANJERÍA</h3>
        </div>

        {/* ROW 1: ORGANISMO Y CLAVE */}
        <div className="row">
          <div className="cell flex-1">
            <div className="cell-label">ORGANISMO U ÓRGANO SOLICITANTE</div>
            <div className="cell-value">ICE</div>
          </div>
          <div className="cell flex-1 cell-last">
            <div className="cell-label" style={{ textAlign: 'center' }}>CLAVE</div>
            <div className="cell-value">X-22 A</div>
          </div>
        </div>

        {/* ROW 2: FECHA DE SALIDA/ENTRADA y No. ACTA */}
        <div className="row-fecha">
          <div className="flex-1" style={{ borderRight: '1px solid #000000', display: 'flex' }}>
            <div className="fecha-label">FECHA DE</div>
            <div className="fecha-contenido">
              {/* SALIDA/ENTRADA */}
              <div className="salida-entrada">
                <div className="salida-cell">
                  <span>SALIDA</span>
                  <CheckBox checked={true} />
                </div>
                <div className="entrada-cell">
                  <span>ENTRADA</span>
                  <CheckBox checked={false} />
                </div>
              </div>

              {/* DÍA, MES, AÑO */}
              <div className="dia-mes-ano">
                <div className="dia-cell">
                  <div className="date-label">DÍA</div>
                  <div className="date-value">{dia}</div>
                </div>
                <div className="mes-cell">
                  <div className="date-label">MES</div>
                  <div className="date-value">{mes}</div>
                </div>
                <div className="ano-cell">
                  <div className="date-label">AÑO</div>
                  <div className="date-value">{ano}</div>
                </div>
              </div>
            </div>
          </div>

          {/* No. ACTA */}
          <div className="no-acta-cell">
            <div className="no-acta-label">No. ACTA</div>
            <div className="no-acta-value">{acta.numeroActa}</div>
          </div>
        </div>

        {/* ROW 3: SOLICITUD DE */}
        <div className="row-solicitud">
          <div className="solicitud-label">SOLICITUD<br />DE</div>

          <div className="solicitud-grid">
            {/* CONFECCIÓN */}
            <div className="solicitud-tipo">CONFECCIÓN</div>
            <div className="solicitud-opciones">
              <div className="opcion"><CheckBox /> PASAPORTE OFICIAL</div>
              <div className="opcion"><CheckBox /> PASAPORTE MARINO</div>
              <div className="opcion"><CheckBox /> PASAPORTE CORRIENTE</div>
              <div className="opcion"><CheckBox /> CERT. DE IDENT. Y VIAJE</div>
            </div>

            {/* REHABILITACIÓN */}
            <div className="solicitud-tipo">REHABILITACIÓN</div>
            <div className="solicitud-opciones">
              <div className="opcion"><CheckBox /> PASAPORTE OFICIAL</div>
            </div>

            {/* PRÓRROGA */}
            <div className="solicitud-tipo">PRÓRROGA</div>
            <div className="solicitud-opciones">
              <div className="opcion"><CheckBox /> PASAPORTE MARINO</div>
              <div className="opcion"><CheckBox /> PASAPORTE CORRIENTE</div>
              <div className="opcion"><CheckBox /> CERT. DE IDENT. Y VIAJE</div>
            </div>

            {/* VISA */}
            <div className="solicitud-tipo-last">VISA</div>
            <div className="solicitud-opciones-last">
              <div className="opcion"><CheckBox /> LUGAR A SITUAR</div>
              <div className="opcion"><CheckBox /> PERMISO ENTRADA</div>
              <div className="opcion"><CheckBox /> PERMISO SALIDA</div>
              <div className="opcion" style={{ textAlign: 'right' }}><CheckBox /> VT</div>
            </div>
          </div>
        </div>

        {/* ROW 4: TABLA DE DATOS */}
        <div className="tabla-datos">
          {/* Header */}
          <div className="tabla-header">
            <div className="tabla-no">No.</div>
            <div className="tabla-nombres">APELLIDOS Y NOMBRES</div>
            <div className="tabla-ciudadania">CIUDADANÍA</div>
            <div className="tabla-importe">Importe</div>
          </div>

          {/* Fila 1 con datos */}
          <div className="tabla-fila-primera">
            <div className="tabla-no">1</div>
            <div className="tabla-nombres">
              {acta.profesor
                ? `${acta.profesor.apellidos}, ${acta.profesor.nombre}`.toUpperCase()
                : ''}
            </div>
            <div className="tabla-ciudadania">CUBA</div>
            <div className="tabla-importe"></div>
          </div>

          {/* Filas vacías */}
          {[2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div key={num} className="tabla-fila">
              <div className="tabla-no">{num}</div>
              <div className="tabla-nombres"></div>
              <div className="tabla-ciudadania"></div>
              <div className="tabla-importe"></div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="footer-pais">{acta.paisDestino?.nombreEs || 'País Destino'}</div>
          <div className="footer-funcion">
            Función: {acta.funcion.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
