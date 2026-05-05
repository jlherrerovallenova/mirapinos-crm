import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Imagen GIF transparente de 1x1 pixel en base64
const PIXEL_BASE64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function decodeBase64(b64: string): Uint8Array {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

const pixelBuffer = decodeBase64(PIXEL_BASE64);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get('tracking_id');

    if (trackingId) {
      // Usamos el rol de servicio para poder hacer bypass del RLS si fuera necesario,
      // o simplemente usar las políticas estándar. Para funciones de tracking es seguro usar anon
      // si tenemos RLS, pero la función RPC "increment_email_open" usa SECURITY DEFINER
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      // Llamar al RPC para incrementar el contador de aperturas
      await supabase.rpc('increment_email_open', { tracking_id: trackingId });
    }
  } catch (error) {
    console.error("Error procesando pixel tracking:", error);
  }

  // Siempre devolver la imagen transparente
  return new Response(pixelBuffer, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
