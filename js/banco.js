/* ============================================================
   Conexão com o Supabase. Estas duas informações ficam SÓ aqui
   e todas as páginas (site, login e admin) usam este arquivo.

   A chave abaixo é a chave PÚBLICA (publishable). Ela pode ficar
   no site. Quem protege os seus dados é o RLS do banco.
   NUNCA coloque aqui a chave secreta (secret / service_role).
   ============================================================ */
(function () {
  var URL_DO_PROJETO = 'https://vjfklngmzgrrekvhwkja.supabase.co';
  var CHAVE_PUBLICA = 'sb_publishable_yAdkU4GxhRaw-kaAEBi9Ww_c0hVjKpi';

  window.BANCO = { url: URL_DO_PROJETO, chave: CHAVE_PUBLICA };

  /* window.sb só existe nas páginas que carregam o Supabase por CDN
     (login e admin). O site público usa BANCO direto, sem a biblioteca. */
  window.sb = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(URL_DO_PROJETO, CHAVE_PUBLICA)
    : null;
})();
