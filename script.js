const campoBusca = document.getElementById("campo-busca");
const botaoBuscar = document.getElementById("botao-buscar");
const resultado = document.getElementById("resultado");
const listaFavoritosDiv = document.getElementById("lista-favoritos");

const API_URL = "https://pokeapi.co/api/v2/pokemon/";

const SUPABASE_URL = "https://ggdhmwfpqcbtkjcfqmox.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Gmj1w89fZcpgCYjTm0rcEw_MiITfvTe";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let pokemonAtual = null;

function nomeFormatado(nome) {
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function mostrarCarregando() {
    resultado.innerHTML = `
        <div class="carregando">
            <div class="spinner"></div>
            <strong>Buscando Pokémon...</strong>
            <p>Consultando a PokéAPI.</p>
        </div>
    `;
}

function mostrarErro(mensagem) {
    resultado.innerHTML = `
        <div class="erro">
            <div class="icone-erro">!</div>
            <h2>Não foi possível realizar a busca</h2>
            <p>${mensagem}</p>
        </div>
    `;
}

function mostrarPokemon(pokemon) {
    pokemonAtual = pokemon;

    const tipos = pokemon.types
        .map(item => `<span class="tipo">${item.type.name}</span>`)
        .join("");

    const imagem =
        pokemon.sprites.other?.["official-artwork"]?.front_default ||
        pokemon.sprites.front_default;

    resultado.innerHTML = `
        <article class="card-pokemon">
            <div class="cabecalho-pokemon">
                <div class="informacoes-principais">
                    <div class="numero">#${String(pokemon.id).padStart(3, "0")}</div>
                    <h2 class="nome-pokemon">${nomeFormatado(pokemon.name)}</h2>
                    <div class="tipos">${tipos}</div>
                </div>

                <img
                    class="imagem-pokemon"
                    src="${imagem}"
                    alt="Imagem do Pokémon ${pokemon.name}"
                >
            </div>

            <div class="informacoes">
                <div class="info">
                    <small>Altura</small>
                    <strong>${(pokemon.height / 10).toFixed(1)} m</strong>
                </div>

                <div class="info">
                    <small>Peso</small>
                    <strong>${(pokemon.weight / 10).toFixed(1)} kg</strong>
                </div>

                <div class="info">
                    <small>Experiência base</small>
                    <strong>${pokemon.base_experience}</strong>
                </div>

                <div class="info">
                    <small>Habilidades</small>
                    <strong>${pokemon.abilities.length}</strong>
                </div>
            </div>
        </article>
        <button id="botao-favoritar" class="botao-favoritar">⭐ Salvar nos Favoritos</button>
    `;

    document.getElementById("botao-favoritar").addEventListener("click", salvarFavorito);
}

async function buscarPokemon(termo) {
    const busca = termo.trim().toLowerCase();

    if (!busca) {
        mostrarErro("Digite o nome ou o número de um Pokémon.");
        return;
    }

    mostrarCarregando();
    botaoBuscar.disabled = true;

    try {
        const resposta = await fetch(API_URL + encodeURIComponent(busca));

        if (!resposta.ok) {
            throw new Error("Pokémon não encontrado.");
        }

        const dados = await resposta.json();
        mostrarPokemon(dados);
    } catch (erro) {
        mostrarErro(
            "Não encontramos esse Pokémon. Confira a escrita e tente novamente."
        );
    } finally {
        botaoBuscar.disabled = false;
    }
}

async function salvarFavorito() {
    if (!pokemonAtual) return;

    const imagem = pokemonAtual.sprites.other?.["official-artwork"]?.front_default || pokemonAtual.sprites.front_default;
    const tipoPrincipal = pokemonAtual.types[0]?.type?.name || "normal";

    const { error } = await supabase
        .from("favoritos")
        .insert([
            { 
                id: pokemonAtual.id, 
                nome: pokemonAtual.name, 
                tipo: tipoPrincipal, 
                imagem: imagem 
            }
        ]);

    if (error) {
        alert("Erro ao salvar favorito: " + error.message);
    } else {
        alert(`${nomeFormatado(pokemonAtual.name)} foi salvo nos favoritos!`);
        carregarFavoritos();
    }
}

async function carregarFavoritos() {
    const { data, error } = await supabase
        .from("favoritos")
        .select("*")
        .order("criado_em", { ascending: false });

    if (error) {
        console.error("Erro ao carregar favoritos:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        listaFavoritosDiv.innerHTML = `<p style="color: var(--cinza);">Nenhum favorito salvo ainda.</p>`;
        return;
    }

    listaFavoritosDiv.innerHTML = data.map(fav => `
        <div class="card-favorito">
            <img src="${fav.imagem}" alt="${fav.nome}">
            <h3>${nomeFormatado(fav.nome)}</h3>
            <p><span class="tipo">${fav.tipo}</span></p>
            <button class="botao-excluir" onclick="excluirFavorito(${fav.id})">Excluir</button>
        </div>
    `).join("");
}

async function excluirFavorito(id) {
    const { error } = await supabase
        .from("favoritos")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        carregarFavoritos();
    }
}

botaoBuscar.addEventListener("click", () => {
    buscarPokemon(campoBusca.value);
});

campoBusca.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
        buscarPokemon(campoBusca.value);
    }
});

window.addEventListener("DOMContentLoaded", () => {
    carregarFavoritos();
});
