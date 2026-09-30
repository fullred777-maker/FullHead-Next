# Recomendações V1 no FullHead-Next

A V1 mantém 154 identidades e 189 opções, com escolhas independentes de Sensibilidade, HUD e Config Pro. O adaptador copia apenas campos públicos estruturados; textos históricos, caminhos locais e nomes de recursos de produção não vão para o cliente. A fonte offline permanece intacta.

## Dados e escolha

- src/data/recommendations-v1.json é o pacote adaptado com hash SHA-256 da fonte.
- O app usa esse pacote imediatamente. Tenta sincronizar recommendations_v1 somente no projeto fullhead---next e aceita apenas o conteúdo integral correspondente à mesma versão. Se a coleção estiver ausente, com leitura bloqueada ou com versão diferente, usa o pacote incluído e identifica isso na interface.
- Todas as escolhas começam vazias. Mudar aparelho, variante, plataforma, perfil ou dedos invalida escolhas dependentes; números de opções incompatíveis não ficam ativos.
- HUD/Config históricos sem vínculo ao SKU são opções condicionais do mesmo perfil, nunca pares automáticos com a sensibilidade.
- Geral, Pro e iOS continuam distintos. Objetivo pessoal é contexto salvo, sem gerar números adicionais.
- O estado transitório e a seleção persistida pertencem ao PlayerProfileProvider existente. Salvar usa a mesma chave local por conta e preserva os campos antigos. Não há nova coleção de perfis remotos.
- DPI não é obrigatório e não aparece como ajuste Android no iOS. Hz aparece apenas como frequência da tela. FPS permanece uma escolha do menu do jogo.
- Os textos públicos são Recomendação inicial FullHead / Ajuste inicial personalizável, com aviso discreto de calibração. Nenhum selo é ativado.
- R3 é apresentado como valores próprios preservados; não é anunciado como um cálculo técnico novo.

## Importação administrativa

npm run recommendations:check executa dry-run sem autenticação nem rede, verificando 154 identidades, 189 opções, escala, origem, flags e limites conservadores de tamanho.

A escrita exige GOOGLE_APPLICATION_CREDENTIALS apontando para chave de serviço de fullhead---next fora do repositório. O projeto declarado na chave e o domínio da conta precisam coincidir. Não há fallback para credenciais implícitas ou produção.

npm run recommendations:import:test cria 154 documentos (189 opções embutidas) em recommendations_v1, em um único batch.create. Qualquer documento já existente cancela o lote; não há overwrite, exclusão ou alteração de presets/huds/configs. Ambiente e projeto incorretos abortam antes de autenticar. Emulador/redirecionamento também é recusado neste comando remoto.

A regra local da coleção permite leitura autenticada e nega toda escrita de cliente. O importador administrativo usa IAM, não abre as regras. Publicar regras e fazer deploy NÃO fazem parte da execução autorizada: até publicação separadamente autorizada, o app pode usar o pacote incluído mesmo após importar.

Referências: [operações atômicas do Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions), [inicialização do SDK administrativo](https://firebase.google.com/docs/admin/setup).

## Reproduzir a adaptação

npm run recommendations:prepare -- --source="caminho/RECOMENDACOES_NUMERICAS_V1.json"

O comando lê a fonte e atualiza apenas o pacote derivado no repositório. Testes e build não requerem acesso remoto. Nenhuma ação desta implementação faz commit, push ou deploy automaticamente.

## Execução desta entrega — 30/09/2026

- Branch main; HEAD 0da4c5ec7d896b9aa03232155f9bd4b752677c17. origin https://github.com/fullred777-maker/FullHead-Next.git; upstream-production com push DISABLED. Nenhum contato com esse remoto.
- Projeto fullhead---next, ambiente next-testing.
- npm test: 45 testes passaram, zero falhas. Inclui regressões existentes, 154/189, P0, 4G/5G, Geral/Pro/iOS, ausência de escolha automática, persistência por conta e renderização das três telas V1. Testes de interface usam componentes reais renderizados em memória; não houve sessão autenticada de navegador.
- ESLint dos arquivos de domínio, componentes, scripts e testes adicionados/modificados: passou. git diff --check: passou.
- npm run recommendations:check: 154 documentos, 189 opções, written=0. Nenhuma autenticação ou chamada ao Firestore.
- npm run build: passou. Chunk V1 sob demanda: 384,13 kB (45,96 kB gzip). O chunk principal de 824,90 kB ainda gera aviso de tamanho do Vite. Build otimizado para o ambiente Next; nenhum deploy.
- SHA-256 da fonte offline preservado: 5d68891672977763c5a9b6c561072898e7770907656460964ab350e495a504ec.
- Revisão dos 18 arquivos da implementação: nenhum material de chave privada/token detectado; nenhuma credencial foi adicionada.
- Firebase de testes: importação concluída em 30/09/2026 após o usuário fornecer a pasta da credencial de serviço do projeto fullhead---next. Coleção recommendations_v1 criada com 154 documentos contendo 189 opções, em um único lote atômico create-only. Credencial permaneceu fora do repositório e foi usada somente no processo da operação.
- Regras: mudança somente local. Publicação depende de autorização explícita de deploy, não concedida nesta etapa. Até lá, o app consegue consumir os 154 aparelhos/189 opções do pacote incluído.
- Nenhum acesso ou alteração em produção, nenhum commit, push ou deploy. A pasta docs/ já estava não rastreada antes e foi preservada.

## Arquivos alterados ou criados

- src/App.jsx: rotas V1 e carregamento sob demanda.
- src/components/RecommendationsV1.jsx e RecommendationsV1.css: interface de seleção e resultados.
- src/domain/recommendationsV1.js: contrato, filtros e invalidação das escolhas.
- src/data/recommendations-v1.json: pacote público derivado.
- scripts/adaptRecommendationsV1.js e prepareRecommendationsV1.js: adaptação reproduzível da fonte.
- scripts/importRecommendationsV1.js: dry-run e importação atômica restrita.
- src/context/PlayerProfileContext.jsx, src/domain/playerProfile.js e src/components/ProfileActive.jsx: extensão compatível do perfil compartilhado.
- src/firebase.js e scripts/firebaseConfig.js: limite explícito ao projeto Next.
- firestore.rules: leitura autenticada/escrita de cliente negada na nova coleção (local).
- package.json: comandos administrativos V1.
- tests/recommendationsV1.test.js e recommendationsV1Ui.test.js: cobertura V1.
- V1_IMPLEMENTATION.md: arquitetura, operação, resultados e pendências.

## Verificação da importação — 30/09/2026, 22:10 UTC

- Ambiente e destino reconfirmados: next-testing / fullhead---next. Branch, HEAD e remotes permaneceram iguais.
- Dry-run: 154 documentos e 189 opções, antes de autenticar ou escrever.
- Coleção recommendations_v1 estava vazia antes da operação. Commit único confirmado: 154 documentos criados.
- Leitura administrativa posterior: 154 identidades e 189 opções, conteúdo integral igual ao pacote adaptado.
- SHA-256 canônico dos documentos remotos: 65c340b41e7752daee7c6835df11ae2ce909f10b228d212ba87d2457bb509bfd.
- Coleções antigas conferidas antes/depois por conteúdo e contagem: presets=18, huds=18, configs=18, treinos=4; todas intactas.
- Nenhuma regra foi publicada, nenhum commit, push ou deploy foi executado. Produção não foi acessada nem alterada.
- A leitura pelo cliente ainda depende das regras remotas permitirem a coleção; nenhuma sessão de usuário foi usada para confirmar essa leitura. O app mantém o pacote V1 incluído como alternativa explícita.
