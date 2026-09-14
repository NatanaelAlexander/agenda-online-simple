export function TerminosPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Términos y condiciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Uso del panel interno de agenda-online-simple
        </p>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Este panel está destinado al personal autorizado del negocio. El acceso
          se realiza con correo y contraseña; no forma parte del flujo de reserva
          pública con Google.
        </p>
        <p>
          Los datos de clientes y citas se gestionan para organizar la agenda del
          local. Debes tratar la información personal de acuerdo con la normativa
          aplicable y las políticas internas de tu negocio.
        </p>
        <p>
          La instalación puede personalizar colores y el layout de la página de
          reserva. Esos estilos aplican a toda la plataforma de esta instalación,
          no a cada visitante por separado.
        </p>
        <p>
          Al usar el panel aceptas mantener credenciales seguras y no compartir
          tu sesión con terceros no autorizados.
        </p>
      </div>
    </div>
  );
}
