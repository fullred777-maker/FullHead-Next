# Importação administrativa dos catálogos de teste

Este fluxo aceita somente o ambiente `next-testing` e o projeto Firebase `fullhead---next`. Ele usa o SDK administrativo para manter as regras públicas do Firestore fechadas.

## 1. Validar sem escrever

```powershell
npm run catalogs:check
```

O comando valida integralmente `presets.json`, `huds.json`, `configs.json` e `treinos.json`, incluindo IDs duplicados, e mostra as quantidades planejadas. Nenhuma credencial é necessária e nenhum dado remoto é acessado.

## 2. Configurar a credencial fora do repositório

Use uma credencial administrativa do projeto de testes armazenada em um diretório seguro, fora deste repositório. Nunca copie o JSON para o projeto, GitHub, Vercel ou chat.

Na sessão local do PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\caminho-seguro\credencial-do-projeto-de-testes.json"
```

## 3. Criar os documentos

```powershell
npm run catalogs:import:test
```

A importação cria os 58 documentos em um único lote atômico: 18 presets, 18 HUDs, 18 Config Pros e 4 treinos. Se qualquer ID já existir, o lote inteiro é cancelado sem sobrescrever dados.

Uma substituição intencional dos mesmos IDs exige a opção adicional `--overwrite`:

```powershell
npm run catalogs:import:test -- --overwrite
```

Use essa opção somente depois de revisar o plano com `npm run catalogs:check`.

## Travas mantidas

- `VITE_FULLHEAD_ENV` e `FULLHEAD_ENV` precisam ser `next-testing`.
- `VITE_FIREBASE_PROJECT_ID` precisa ser exatamente `fullhead---next`.
- A escrita exige a confirmação explícita `--confirm-project=fullhead---next`, já fixada no script npm de teste.
- As regras do Firestore continuam com escrita negada para os catálogos; o importador usa autenticação administrativa local.
- Arquivos de credencial e `.env.local` continuam ignorados pelo Git.
