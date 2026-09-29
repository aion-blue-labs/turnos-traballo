# Os meus turnos

PWA estática en galego para gardar quendas de traballo só no dispositivo (`cristina_turnos_v1`). Non emprega rede, analítica nin servizos externos.

## Proba local

Servir a carpeta por HTTP (por exemplo `python -m http.server 8090`) e abrir `http://localhost:8090`.

## Lista de comprobación

- Navegar entre meses e volver a hoxe.
- Pintar varios días con cada quenda e desfacer.
- Editar un día con servizo e nota; recargar e comprobar persistencia.
- Verificar horas dunha quenda nocturna (22:00–08:00 = 10 h).
- Personalizar, engadir e borrar tipos de quenda.
- Descargar e restaurar unha copia JSON.
- Comprobar a app a 360 px de ancho e coa navegación por teclado.
- Activar modo sen conexión tras unha primeira visita.
