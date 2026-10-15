
const SUPABASE_URL =
  "https://wsgvyrdyjsypudjrvwai.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_R-pa0w52wXdO9aBgd3YmqQ_3YFYjpB2";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let usuarioMentacoes = null;
window.usuarioMentacoes = null;
let usuarioEhAdmin = false;
window.usuarioEhAdmin = false;

async function verificarAdministrador() {
  usuarioEhAdmin = false;
  window.usuarioEhAdmin = false;

  if (!usuarioMentacoes) return false;

  const { data, error } = await supabaseClient.rpc("is_admin");

  if (error) {
    console.error("Erro ao verificar administrador:", error);
    return false;
  }

  usuarioEhAdmin = data === true;
  window.usuarioEhAdmin = usuarioEhAdmin;

  return usuarioEhAdmin;
}

const $ = id => document.getElementById(id);

const authForm = $("auth-form");
const emailInput = $("email");
const passwordInput = $("password");
const loginBtn = $("login-btn");
const signupBtn = $("signup-btn");
const logoutBtn = $("logout-btn");
const authMessage = $("auth-message");

const citacaoForm = $("citacao-form");
const conteudoInput = $("conteudo-citacao");
const categoriaInput = $("categoria-citacao");
const salvarBtn = $("salvar-btn");
const publicacaoMessage = $("mensagem-publicacao");

const listaCitacoes = $("lista-citacoes");
const estadoCitacoes = $("estado-citacoes");

const perfilForm = $("perfil-form");
const nomePerfilInput = $("nome-perfil");
const fotoPerfilInput = $("foto-perfil-arquivo");
const fotoPerfilPreview = $("foto-perfil-preview");
const nomePerfilExibido = $("nome-perfil-exibido");
const emailPerfilExibido = $("email-perfil-exibido");
const mensagemPerfil = $("mensagem-perfil");
const salvarPerfilBtn = $("salvar-perfil-btn");

let perfisCache = {};

function mensagem(elemento, texto) {
  if (elemento) elemento.textContent = texto;
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function atualizarInterfaceVisual() {
  const conectado = Boolean(usuarioMentacoes);

  loginBtn.hidden = conectado;
  signupBtn.hidden = conectado;
  logoutBtn.hidden = !conectado;

  emailInput.hidden = conectado;
  passwordInput.hidden = conectado;

  mensagem(
    authMessage,
    conectado
      ? "Você está conectado: " + usuarioMentacoes.email
      : "Entre ou crie sua conta para participar."
  );

  if (!conectado) {
   

    perfilForm.reset();
    nomePerfilInput.disabled = true;
    fotoPerfilInput.disabled = true;
    salvarPerfilBtn.disabled = true;

    nomePerfilExibido.textContent = "Membro";
    emailPerfilExibido.textContent = "";
    fotoPerfilPreview.hidden = true;
    fotoPerfilPreview.removeAttribute("src");

    mensagem(mensagemPerfil, "Entre na sua conta para editar seu perfil.");
  } else {
    nomePerfilInput.disabled = false;
    fotoPerfilInput.disabled = false;
    salvarPerfilBtn.disabled = false;

    emailPerfilExibido.textContent = usuarioMentacoes.email || "";
    mensagem(mensagemPerfil, "");
  }
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

// -------------------------
// PERFIL
// -------------------------

async function carregarPerfil() {
  if (!usuarioMentacoes) return;

  mensagem(mensagemPerfil, "Carregando perfil...");

  const { data, error } = await supabaseClient
    .from("perfis")
    .select("usuario_id, nome_exibicao, foto_url")
    .eq("usuario_id", usuarioMentacoes.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    mensagem(mensagemPerfil, "Não foi possível carregar seu perfil.");
    return;
  }

  if (data) {
    nomePerfilInput.value = data.nome_exibicao || "";
    nomePerfilExibido.textContent = data.nome_exibicao || "Membro";

    if (data.foto_url) {
      fotoPerfilPreview.src = data.foto_url;
      fotoPerfilPreview.hidden = false;
    } else {
      fotoPerfilPreview.hidden = true;
      fotoPerfilPreview.removeAttribute("src");
    }
  } else {
    nomePerfilInput.value = "";
    nomePerfilExibido.textContent = "Membro";
    fotoPerfilPreview.hidden = true;
    fotoPerfilPreview.removeAttribute("src");
  }

  mensagem(mensagemPerfil, "");
}

fotoPerfilInput.addEventListener("change", () => {
  const arquivo = fotoPerfilInput.files[0];

  if (!arquivo) return;

  const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!tiposPermitidos.includes(arquivo.type)) {
    fotoPerfilInput.value = "";
    mensagem(mensagemPerfil, "Escolha uma imagem JPG, PNG ou WebP.");
    return;
  }

  if (arquivo.size > 2 * 1024 * 1024) {
    fotoPerfilInput.value = "";
    mensagem(mensagemPerfil, "A foto deve ter no máximo 2 MB.");
    return;
  }

  const urlTemporaria = URL.createObjectURL(arquivo);
  fotoPerfilPreview.src = urlTemporaria;
  fotoPerfilPreview.hidden = false;
  mensagem(mensagemPerfil, "Prévia da foto. Clique em Salvar perfil para confirmar.");
});

perfilForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!usuarioMentacoes) {
    mensagem(mensagemPerfil, "Entre na sua conta primeiro.");
    return;
  }

  const nome = nomePerfilInput.value.trim();
  const arquivo = fotoPerfilInput.files[0];

  if (!nome || nome.length > 40) {
    mensagem(mensagemPerfil, "O nome deve ter entre 1 e 40 caracteres.");
    return;
  }

  if (arquivo) {
    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!tiposPermitidos.includes(arquivo.type) ||
        arquivo.size > 2 * 1024 * 1024) {
      mensagem(mensagemPerfil, "Confira o formato e o tamanho da foto.");
      return;
    }
  }

  salvarPerfilBtn.disabled = true;
  mensagem(mensagemPerfil, "Salvando perfil...");

  try {
    let fotoUrl = null;

    const { data: perfilAtual, error: erroPerfil } =
      await supabaseClient
        .from("perfis")
        .select("foto_url")
        .eq("usuario_id", usuarioMentacoes.id)
        .maybeSingle();

    if (erroPerfil) throw erroPerfil;

    fotoUrl = perfilAtual?.foto_url || null;

    if (arquivo) {
      const extensoes = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      };

      const extensao = extensoes[arquivo.type];
      const caminho = `${usuarioMentacoes.id}/avatar.${extensao}`;

      const { error: erroUpload } = await supabaseClient
        .storage
        .from("avatars")
        .upload(caminho, arquivo, {
          upsert: true,
          contentType: arquivo.type
        });

      if (erroUpload) throw erroUpload;

      const { data: urlPublica } = supabaseClient
        .storage
        .from("avatars")
        .getPublicUrl(caminho);

      // Evita manter uma prévia antiga em cache.
      fotoUrl = urlPublica.publicUrl + "?v=" + Date.now();
    }

    const { error } = await supabaseClient
      .from("perfis")
      .upsert({
        usuario_id: usuarioMentacoes.id,
        nome_exibicao: nome,
        foto_url: fotoUrl,
        atualizado_em: new Date().toISOString()
      }, {
        onConflict: "usuario_id"
      });

    if (error) throw error;

    nomePerfilExibido.textContent = nome;

    if (fotoUrl) {
      fotoPerfilPreview.src = fotoUrl;
      fotoPerfilPreview.hidden = false;
    } else {
      fotoPerfilPreview.hidden = true;
    }

    fotoPerfilInput.value = "";
    mensagem(mensagemPerfil, "Perfil salvo com sucesso! 💜");

    await carregarCitacoes();
  } catch (error) {
    console.error(error);
    mensagem(mensagemPerfil, "Erro ao salvar perfil: " + error.message);
  } finally {
    salvarPerfilBtn.disabled = !usuarioMentacoes;
  }
});

// -------------------------
// CITAÇÕES, CURTIDAS E COMENTÁRIOS
// -------------------------

async function alternarFavorito(citacaoId, jaFavoritou) {
  if (!usuarioMentacoes) {
    mensagem(authMessage, "Entre na sua conta para favoritar.");
    $("conta").scrollIntoView({ behavior: "smooth" });
    return false;
  }

  const usuarioId = usuarioMentacoes.id;

  try {
    if (jaFavoritou) {
      const { error } = await supabaseClient
        .from("favoritos")
        .delete()
        .eq("citacao_id", citacaoId)
        .eq("usuario_id", usuarioId);

      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from("favoritos")
        .insert({
          citacao_id: citacaoId,
          usuario_id: usuarioId
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error("Erro nos favoritos:", error);
    alert("Erro ao salvar favorito: " + error.message);
    return false;
  }
}

async function carregarCitacoes() {
  mensagem(estadoCitacoes, "Carregando citações...");

  const { data: citacoes, error } = await supabaseClient
    .from("citacoes")
    .select("id, conteudo, categoria, autor_id, criado_em, oficial")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error(error);
    mensagem(estadoCitacoes, "Erro ao carregar citações. Confira o Supabase.");
    return;
  }

  listaCitacoes.replaceChildren();

  if (!citacoes || citacoes.length === 0) {
    mensagem(
      estadoCitacoes,
      "Ainda não há citações publicadas pela comunidade."
    );
    return;
  }

  const ids = citacoes.map(c => c.id);


const [
  resultadoCurtidas,
  resultadoComentarios,
  resultadoFavoritos
] = await Promise.all([
  supabaseClient
    .from("curtidas")
    .select("citacao_id, usuario_id")
    .in("citacao_id", ids),

  supabaseClient
    .from("comentarios")
    .select("id, citacao_id, usuario_id, conteudo, criado_em")
    .in("citacao_id", ids)
    .order("criado_em", { ascending: true }),

  usuarioMentacoes
    ? supabaseClient
        .from("favoritos")
        .select("citacao_id, usuario_id")
        .eq("usuario_id", usuarioMentacoes.id)
        .in("citacao_id", ids)
    : Promise.resolve({ data: [], error: null })
]);

 
if (
  resultadoCurtidas.error ||
  resultadoComentarios.error ||
  resultadoFavoritos.error
) {
  console.error(
    resultadoCurtidas.error ||
    resultadoComentarios.error ||
    resultadoFavoritos.error
  );

  mensagem(
    estadoCitacoes,
    "Erro ao carregar dados. Confira as tabelas e permissões do Supabase."
  );
  return;
}


  const curtidas = resultadoCurtidas.data || [];
  const comentarios = resultadoComentarios.data || [];
  const favoritos = resultadoFavoritos.data || [];

  // Carrega os nomes e as fotos dos autores e comentaristas.
  const usuariosIds = [
    ...new Set([
      ...citacoes.map(c => c.autor_id),
      ...comentarios.map(c => c.usuario_id)
    ])
  ];

  perfisCache = {};

  if (usuariosIds.length) {
    const { data: perfis, error: erroPerfis } = await supabaseClient
      .from("perfis")
      .select("usuario_id, nome_exibicao, foto_url")
      .in("usuario_id", usuariosIds);

    if (erroPerfis) {
      console.error("Erro ao carregar nomes dos perfis:", erroPerfis);
    } else {
      for (const perfil of perfis || []) {
        perfisCache[perfil.usuario_id] = perfil;
      }
    }
  }

  mensagem(
    estadoCitacoes,
    citacoes.length === 1
      ? "1 citação publicada."
      : citacoes.length + " citações publicadas."
  );

  for (const citacao of citacoes) {
    const curtidasDaCitacao = curtidas.filter(
      c => c.citacao_id === citacao.id
    );

    const comentariosDaCitacao = comentarios.filter(
      c => c.citacao_id === citacao.id
    );

    const jaCurtiu = Boolean(
      usuarioMentacoes &&
      curtidasDaCitacao.some(
        c => c.usuario_id === usuarioMentacoes.id
      )
    );

    const artigo = criarElemento("article", "quote");

    const categoria = criarElemento(
      "span",
      "category",
      citacao.categoria
    );

    const texto = criarElemento("p", "", citacao.conteudo);

    const perfilAutor = perfisCache[citacao.autor_id];
    const autor = criarElemento(
      "div",
      "author",
      "Por: " + (
        usuarioMentacoes && citacao.autor_id === usuarioMentacoes.id
          ? "Você"
          : perfilAutor?.nome_exibicao || "Membro da comunidade"
      )
    );

    if (perfilAutor?.foto_url) {
      const fotoAutor = document.createElement("img");
      fotoAutor.src = perfilAutor.foto_url;
      fotoAutor.alt = "Foto de " + (
        perfilAutor.nome_exibicao || "membro"
      );
      fotoAutor.loading = "lazy";
      fotoAutor.style.cssText =
        "width:32px;height:32px;object-fit:cover;border-radius:50%;vertical-align:middle;margin-right:8px;";
      autor.prepend(fotoAutor);
    }

const jaFavoritou = favoritos.some(
  f => String(f.citacao_id) === String(citacao.id)
);

    const acoes = criarElemento("div", "actions");

    const copiarBtn = criarElemento("button", "", "Copiar citação");
    copiarBtn.type = "button";

    copiarBtn.addEventListener("click", async () => {
      const sucesso = await copiarTexto(citacao.conteudo);
      copiarBtn.textContent = sucesso
        ? "Copiado!"
        : "Não foi possível copiar";

      setTimeout(() => {
        copiarBtn.textContent = "Copiar citação";
      }, 1500);
    });

    const curtirBtn = criarElemento(
      "button",
      "secondary",
      (jaCurtiu ? "❤️ Curtido" : "🤍 Curtir") +
        " (" + curtidasDaCitacao.length + ")"
    );
    curtirBtn.type = "button";

    curtirBtn.addEventListener("click", async () => {
      if (!usuarioMentacoes) {
        mensagem(authMessage, "Entre na sua conta para curtir.");
        $("conta").scrollIntoView({ behavior: "smooth" });
        return;
      }

      curtirBtn.disabled = true;

      try {
        if (jaCurtiu) {
          const { error } = await supabaseClient
            .from("curtidas")
            .delete()
            .eq("citacao_id", citacao.id)
            .eq("usuario_id", usuarioMentacoes.id);

          if (error) throw error;
        } else {
          const { error } = await supabaseClient
            .from("curtidas")
            .insert({
              citacao_id: citacao.id,
              usuario_id: usuarioMentacoes.id
            });

          if (error) throw error;
        }

        await carregarCitacoes();
      } catch (error) {
        console.error(error);
        alert("Não foi possível atualizar a curtida. Tente novamente.");
      } finally {
        curtirBtn.disabled = false;
      }
    });

    
const favoritoBtn = criarElemento(
  "button",
  "secondary",
  jaFavoritou ? "⭐ Favoritado" : "☆ Favoritar"
);

favoritoBtn.type = "button";

favoritoBtn.addEventListener("click", async () => {
  favoritoBtn.disabled = true;

  try {
    const sucesso = await alternarFavorito(
      citacao.id,
      jaFavoritou
    );

   if (sucesso) {
  await carregarCitacoes();
  await carregarFavoritos();
}
  } finally {
    favoritoBtn.disabled = false;
  }
});

acoes.append(copiarBtn, curtirBtn, favoritoBtn);


    // O autor pode apagar apenas as próprias citações.
    if (usuarioMentacoes &&
        citacao.autor_id === usuarioMentacoes.id) {
      const apagarBtn = criarElemento(
        "button",
        "secondary",
        "Excluir citação"
      );
      apagarBtn.type = "button";

      apagarBtn.addEventListener("click", async () => {
        const confirmar = confirm(
          "Tem certeza de que deseja excluir esta citação?"
        );

        if (!confirmar) return;

        apagarBtn.disabled = true;
try {
  let exclusao = supabaseClient
    .from("citacoes")
    .delete()
    .eq("id", citacao.id);

  if (!usuarioEhAdmin) {
    exclusao = exclusao.eq("autor_id", usuarioMentacoes.id);
  }

  const { error } = await exclusao;

  if (error) throw error;

  await carregarCitacoes();
}
        catch (error) {
          console.error(error);
          alert("Não foi possível excluir a citação.");
          apagarBtn.disabled = false;
        }
      });

      acoes.appendChild(apagarBtn);
    }

    const areaComentarios = document.createElement("div");
    areaComentarios.style.marginTop = "22px";

    const tituloComentarios = criarElemento(
      "h3",
      "",
      "💬 Comentários (" + comentariosDaCitacao.length + ")"
    );
    tituloComentarios.style.color = "#c4b5fd";
    tituloComentarios.style.marginBottom = "12px";

    areaComentarios.appendChild(tituloComentarios);

    for (const comentario of comentariosDaCitacao) {
      const item = document.createElement("div");
      item.style.borderTop = "1px solid #38294d";
      item.style.padding = "12px 0";

      const conteudoComentario = criarElemento(
        "p",
        "",
        comentario.conteudo
      );
      conteudoComentario.style.margin = "0 0 6px";
      conteudoComentario.style.fontSize = "15px";
      conteudoComentario.style.whiteSpace = "pre-wrap";

      const perfilComentario = perfisCache[comentario.usuario_id];
      const nomeComentario =
        usuarioMentacoes &&
        comentario.usuario_id === usuarioMentacoes.id
          ? "Você"
          : perfilComentario?.nome_exibicao || "Membro da comunidade";

      const assinatura = criarElemento("small", "", nomeComentario);
      assinatura.style.color = "#aaa1bd";

      item.append(conteudoComentario, assinatura);
      areaComentarios.appendChild(item);
    }

    const formularioComentario = document.createElement("form");
    formularioComentario.style.marginTop = "12px";

    const campoComentario = document.createElement("textarea");
    campoComentario.placeholder = usuarioMentacoes
      ? "Escreva um comentário..."
      : "Entre na sua conta para comentar";
    campoComentario.maxLength = 500;
    campoComentario.rows = 2;
    campoComentario.required = true;
    campoComentario.disabled = !usuarioMentacoes;

    const enviarComentario = criarElemento(
      "button",
      "",
      "Comentar"
    );
    enviarComentario.type = "submit";
    enviarComentario.disabled = !usuarioMentacoes;

    formularioComentario.append(campoComentario, enviarComentario);

    formularioComentario.addEventListener("submit", async event => {
      event.preventDefault();

      if (!usuarioMentacoes) {
        mensagem(authMessage, "Entre na sua conta para comentar.");
        return;
      }

      const conteudoComentario = campoComentario.value.trim();

      if (!conteudoComentario || conteudoComentario.length > 500) {
        alert("O comentário deve ter entre 1 e 500 caracteres.");
        return;
      }

      enviarComentario.disabled = true;

      try {
        const { error } = await supabaseClient
          .from("comentarios")
          .insert({
            citacao_id: citacao.id,
            usuario_id: usuarioMentacoes.id,
            conteudo: conteudoComentario
          });

        if (error) throw error;

        await carregarCitacoes();
      } catch (error) {
        console.error(error);
        alert("Não foi possível publicar o comentário. Tente novamente.");
      } finally {
        enviarComentario.disabled = !usuarioMentacoes;
      }
    });

    areaComentarios.appendChild(formularioComentario);
    artigo.append(categoria, texto, autor, acoes, areaComentarios);
    listaCitacoes.appendChild(artigo);
  }
}

async function carregarFavoritos() {
  const lista = $("lista-favoritos");
  const estado = $("estado-favoritos");

  if (!lista || !estado) return;

  lista.replaceChildren();

  if (!usuarioMentacoes) {
    mensagem(estado, "Entre na sua conta para ver seus favoritos.");
    return;
  }

  mensagem(estado, "Carregando seus favoritos...");

  try {
    const { data: favoritos, error: erroFavoritos } =
      await supabaseClient
        .from("favoritos")
        .select("citacao_id")
        .eq("usuario_id", usuarioMentacoes.id);

    if (erroFavoritos) throw erroFavoritos;

    if (!favoritos || favoritos.length === 0) {
      mensagem(estado, "Você ainda não favoritou nenhuma citação. ⭐");
      return;
    }

    const ids = favoritos.map(f => f.citacao_id);

    const { data: citacoes, error: erroCitacoes } =
      await supabaseClient
        .from("citacoes")
        .select("id, conteudo, categoria, autor_id, criado_em")
        .in("id", ids)
        .order("criado_em", { ascending: false });

    if (erroCitacoes) throw erroCitacoes;

    if (!citacoes || citacoes.length === 0) {
      mensagem(estado, "Não foi possível encontrar suas citações salvas.");
      return;
    }

    const autoresIds = [...new Set(citacoes.map(c => c.autor_id))];

    const { data: perfis, error: erroPerfis } =
      await supabaseClient
        .from("perfis")
        .select("usuario_id, nome_exibicao")
        .in("usuario_id", autoresIds);

    if (erroPerfis) throw erroPerfis;

    const nomes = {};

    for (const perfil of perfis || []) {
      nomes[perfil.usuario_id] =
        perfil.nome_exibicao || "Membro da comunidade";
    }

    mensagem(
      estado,
      citacoes.length === 1
        ? "Você tem 1 citação favorita."
        : `Você tem ${citacoes.length} citações favoritas.`
    );

    for (const citacao of citacoes) {
      const artigo = criarElemento("article", "quote");
      const categoria = criarElemento(
        "span",
        "category",
        citacao.categoria || "Geral"
      );

      const texto = criarElemento("p", "", citacao.conteudo);

      const nomeAutor =
        citacao.autor_id === usuarioMentacoes.id
          ? "Você"
          : nomes[citacao.autor_id] || "Membro da comunidade";

      const autor = criarElemento("div", "author", "Por: " + nomeAutor);
      const acoes = criarElemento("div", "actions");

      const copiarBtn = criarElemento("button", "", "Copiar citação");
      copiarBtn.type = "button";

      copiarBtn.addEventListener("click", async () => {
        const sucesso = await copiarTexto(citacao.conteudo);
        copiarBtn.textContent = sucesso ? "Copiado! 💜" : "Falha ao copiar";

        setTimeout(() => {
          copiarBtn.textContent = "Copiar citação";
        }, 1500);
      });

      const removerBtn = criarElemento(
        "button",
        "secondary",
        "☆ Remover dos favoritos"
      );
      removerBtn.type = "button";

      removerBtn.addEventListener("click", async () => {
        removerBtn.disabled = true;

        const sucesso = await alternarFavorito(citacao.id, true);

        if (sucesso) {
          await carregarFavoritos();
          await carregarCitacoes();
        } else {
          removerBtn.disabled = false;
        }
      });

      acoes.append(copiarBtn, removerBtn);
      artigo.append(categoria, texto, autor, acoes);
      lista.appendChild(artigo);
    }
  } catch (error) {
    console.error("Erro ao carregar favoritos:", error);
    mensagem(estado, "Erro ao carregar favoritos. Confira as permissões do Supabase.");
  }
}

// -------------------------
// CADASTRO E LOGIN
// -------------------------

signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || password.length < 6) {
    mensagem(
      authMessage,
      "Informe um e-mail válido e uma senha com pelo menos 6 caracteres."
    );
    return;
  }

  signupBtn.disabled = true;
  mensagem(authMessage, "Criando sua conta...");

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    if (data.session) {
      await definirUsuario(data.session.user);
    } else {
      mensagem(
        authMessage,
        "Cadastro recebido. Se a confirmação de e-mail estiver ativa, confira sua caixa de entrada."
      );
    }
  } catch (error) {
    mensagem(authMessage, "Erro no cadastro: " + error.message);
  } finally {
    signupBtn.disabled = false;
  }
});

authForm.addEventListener("submit", async event => {
  event.preventDefault();

  loginBtn.disabled = true;
  mensagem(authMessage, "Entrando...");

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    if (error) throw error;

    await definirUsuario(data.user);
  } catch (error) {
    mensagem(authMessage, "Erro no login: " + error.message);
  } finally {
    loginBtn.disabled = false;
  }
});


async function definirUsuario(usuario) {
  usuarioMentacoes = usuario || null;
  window.usuarioMentacoes = usuarioMentacoes;

await verificarAdministrador();

const painelAdmin = document.getElementById("painel-admin");

if (painelAdmin) {
  painelAdmin.style.display =
    window.usuarioEhAdmin === true ? "block" : "none";
}
  atualizarInterfaceVisual();

  if (usuarioMentacoes) {
    await carregarPerfil();
  }

  await carregarCitacoes();
  await carregarFavoritos();
}


logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;

  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    usuarioMentacoes = null;
    window.usuarioMentacoes = null;

    atualizarInterfaceVisual();
    await carregarCitacoes();
    await carregarFavoritos();
  } catch (error) {
    mensagem(authMessage, "Erro ao sair: " + error.message);
  } finally {
    logoutBtn.disabled = false;
  }
});

// -------------------------
// PUBLICAR CITAÇÃO
// -------------------------

citacaoForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!usuarioMentacoes) {
    mensagem(publicacaoMessage, "Entre na sua conta para publicar.");
    return;
  }

  const conteudo = conteudoInput.value.trim();
  const categoria = categoriaInput.value;

  if (!conteudo || conteudo.length > 1000) {
    mensagem(
      publicacaoMessage,
      "A citação deve ter entre 1 e 1000 caracteres."
    );
    return;
  }

  salvarBtn.disabled = true;
  mensagem(publicacaoMessage, "Salvando citação...");

  try {
    const { error } = await supabaseClient
      .from("citacoes")
      .insert({
        conteudo,
        categoria,
        autor_id: usuarioMentacoes.id
      });

    if (error) throw error;

    citacaoForm.reset();
    mensagem(publicacaoMessage, "Citação publicada! 💜");

    await carregarCitacoes();
  } catch (error) {
    mensagem(publicacaoMessage, "Erro ao publicar: " + error.message);
  } finally {
    salvarBtn.disabled = false;
  }
});

 // -------------------------
// INICIALIZAÇÃO
// -------------------------

let inicializacaoEmAndamento = false;

supabaseClient.auth.onAuthStateChange((evento, session) => {
  // Evita repetir operações para o mesmo estado de autenticação.
 usuarioMentacoes = session?.user ?? null;
window.usuarioMentacoes = usuarioMentacoes;

Promise.resolve().then(() => {
  definirUsuario(session?.user ?? null);
});

  // Executa as consultas depois do callback de autenticação.
  Promise.resolve().then(async () => {
    if (inicializacaoEmAndamento) return;

    inicializacaoEmAndamento = true;

    try {
      if (usuarioMentacoes) {
        await carregarPerfil();
      }

      await carregarCitacoes();
    await carregarFavoritos();}
     finally {
      inicializacaoEmAndamento = false;
    }
  });
});

async function iniciarMentacoes() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    mensagem(authMessage, "Erro ao verificar sua sessão.");
    return;
  }

  await definirUsuario(data.session?.user ?? null);
}


  if (usuarioMentacoes) {
    await carregarPerfil();
  }

  await carregarCitacoes();
await carregarFavoritos();
}

iniciarMentacoes();


document
  .getElementById("form-citacao-oficial")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const aviso = document.getElementById("mensagem-admin");
    const conteudo = document
      .getElementById("conteudo-oficial")
      .value.trim();
    const categoria = document
      .getElementById("categoria-oficial")
      .value.trim();

    if (!usuarioMentacoes || !usuarioEhAdmin) {
      aviso.textContent = "Acesso permitido apenas à equipe.";
      return;
    }

    if (!conteudo || !categoria) {
      aviso.textContent = "Preencha todos os campos.";
      return;
    }

    aviso.textContent = "Publicando...";

    const { error } = await supabaseClient
      .from("citacoes")
      .insert({
        conteudo: conteudo,
        categoria: categoria,
        autor_id: usuarioMentacoes.id,
        oficial: true
      });

    if (error) {
      console.error(error);
      aviso.textContent = "Erro ao publicar. Confira o Supabase.";
      return;
    }

    document.getElementById("conteudo-oficial").value = "";
    document.getElementById("categoria-oficial").value = "";
    aviso.textContent = "Citação oficial publicada! 💜";

    await carregarCitacoes();
  });
