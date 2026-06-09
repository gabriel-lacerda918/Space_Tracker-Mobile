<div align="center">

# Space Tracker
### Monitoramento de Lixo Espacial e Proteção de Constelações de Satélites

**Projeto FIAP — Mobile Development & IoT**

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/docs/Web/JavaScript)

</div>

---

## Objetivo

O aumento acelerado de satélites na órbita baixa da Terra (LEO) cria um risco crescente de colisões em cascata — o chamado **Síndrome de Kessler** — que poderia inutilizar faixas orbitais inteiras por décadas.

O **Space Tracker** é um dashboard mobile para **engenheiros de operações de satélites** que permite:

- Monitorar em tempo real a saúde de uma constelação de satélites
- Rastrear detritos espaciais catalogados e seu nível de risco
- Receber **Alertas Vermelhos** imediatos quando um satélite está em rota de colisão
- Registrar e acompanhar **manobras evasivas** executadas pelos operadores
- Consultar passagens de satélites com base na **localização GPS** do operador
- Manter uma **galeria de registros visuais** capturados pela câmera do dispositivo

---

## Tema — Economia Espacial e o Futuro da Órbita

A órbita terrestre baixa abriga mais de **9.000 satélites ativos** e cerca de **27.000 objetos rastreáveis** de lixo espacial, segundo a ESA. Empresas como SpaceX (Starlink), OneWeb e Amazon (Kuiper) planejam lançar dezenas de milhares de satélites adicionais nos próximos anos.

Neste cenário, ferramentas de **situational awareness orbital** deixaram de ser exclusividade de agências governamentais e passaram a ser uma necessidade crítica para operadores comerciais privados — representando uma oportunidade de mercado bilionária na nova economia espacial.

O Space Tracker simula exatamente esse tipo de ferramenta: um sistema de monitoramento e resposta a eventos orbitais de risco, acessível diretamente pelo celular do engenheiro de plantão.

---

## Telas do Aplicativo

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     Dashboard    │  │    Satélites     │  │    Alertas       │
│──────────────────│  │──────────────────│  │──────────────────│


┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Detritos       │  │   Det. Alerta    │  │    Manobras      │
│──────────────────│  │──────────────────│  │──────────────────│


┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Localização    │  │     Galeria      │  │   Det.Satélite   │
│──────────────────│  │──────────────────│  │──────────────────│

```

---

## Estrutura do Projeto

```
space-tracker/
├── App.js                              # Entrada + SafeAreaProvider
├── index.js
├── app.json                            # Config Expo (permissões Android/iOS)
├── package.json
└── src/
    ├── navigation/
    │   └── AppNavigator.js             # Bottom Tabs + Stack Navigator
    ├── screens/
    │   ├── DashboardScreen.js          # Visão geral, alertas ativos, ações rápidas
    │   ├── SatellitesScreen.js         # Listagem com filtros e busca
    │   ├── SatelliteDetailScreen.js    # Parâmetros orbitais + visualizador
    │   ├── AddSatelliteScreen.js       # Cadastro com preview orbital em tempo real
    │   ├── AlertsScreen.js             # Alertas ativos com resolução manual
    │   ├── AlertDetailScreen.js        # Detalhes + ordenar manobra evasiva
    │   ├── DebrisScreen.js             # Detritos filtrados por nível de risco
    │   ├── DebrisDetailScreen.js       # Ficha técnica do detrito
    │   ├── ManeuversScreen.js          # Histórico e registro de manobras
    │   ├── GalleryScreen.js            # Galeria com câmera e media library
    │   └── LocationTrackerScreen.js    # GPS + mapa polar de passagens
    ├── firebase/
    │   ├── config.js                   # Inicialização do Firebase (sem re-init)
    │   └── spaceService.js             # CRUD: satélites, detritos, alertas, manobras, galeria
    ├── data/
    │   ├── seedData.js                 # Dados simulados realistas (TLE públicos)
    │   └── carAPI.js                   # (reservado para integração futura)
    ├── hooks/
    │   └── useNotifications.js         # Push notifications: colisão, manobra, conjunção
    └── utils/
        └── orbitCalc.js               # Cálculos orbitais: velocidade, período, risco
```

---

## Recursos Mobile Utilizados

### 1. GPS e Localização — `expo-location`

**Onde:** `LocationTrackerScreen.js`

O app solicita permissão de localização em primeiro plano e obtém as coordenadas reais do dispositivo (latitude, longitude, altitude) via `Location.getCurrentPositionAsync()`.

Com a posição do operador em mãos, o app calcula quais satélites da constelação passarão sobre aquele ponto geográfico nas próximas horas, exibindo:
- **Mapa polar** interativo com a posição angular de cada satélite
- Tempo para a próxima passagem, elevação máxima, azimute e duração visível
- Indicação colorida por status do satélite (operacional, alerta, crítico)

```js
const { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') { /* trata permissão negada */ }
const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
```

**Tratamento de erro:** caso a permissão seja negada ou o GPS esteja desativado, o app exibe mensagem explicativa e bloqueia o fluxo de forma não-destrutiva.

---

### 2. Câmera — `expo-camera` + `expo-image-picker`

**Onde:** `GalleryScreen.js`

O app permite que o engenheiro **capture fotos diretamente pela câmera** do dispositivo ou **importe imagens da galeria do sistema** para criar um registro visual associado ao monitoramento da missão.

O fluxo completo inclui:
- Solicitação de permissão de câmera (`requestCameraPermissionsAsync`)
- Abertura da câmera nativa com suporte a edição (`launchCameraAsync`)
- Importação da galeria do dispositivo (`launchImageLibraryAsync`)
- Armazenamento dos metadados no Firebase Realtime Database
- Visualizador em tela cheia com opção de exclusão

```js
const { status } = await ImagePicker.requestCameraPermissionsAsync();
const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
if (!result.canceled) await persistImage(result.assets[0].uri, 'camera');
```

**Tratamento de erro:** permissão negada exibe alerta explicativo; falha no salvamento exibe mensagem de erro sem travar a tela.

---

### 3. Notificações Push — `expo-notifications`

**Onde:** `useNotifications.js` (hook), disparado em `DashboardScreen.js` e `AlertDetailScreen.js`

O app envia notificações locais imediatas em três situações críticas:

| Evento | Título | Prioridade |
|---|---|---|
| Risco de colisão detectado | ALERTA VERMELHO — RISCO DE COLISÃO | `max` |
| Manobra evasiva confirmada | Manobra Evasiva Confirmada | normal |
| Conjunção orbital detectada | Conjunção Detectada | normal |

```js
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'ALERTA VERMELHO — RISCO DE COLISÃO',
    body: `${satelliteName} em rota com ${debrisName} | TCA: ${tca}`,
    priority: 'max',
    color: '#FF2D2D',
  },
  trigger: null, // disparo imediato
});
```

**Tratamento de erro:** a permissão é solicitada no carregamento inicial do Dashboard; se negada, o app continua funcionando normalmente sem os alertas sonoros.

---

### 4. Galeria de Mídia — `expo-media-library`

**Onde:** `GalleryScreen.js`

Permite acesso à **biblioteca de fotos do dispositivo** para que o operador importe imagens já existentes (por exemplo, prints de telemetria, fotos de displays de controle, ou imagens de câmeras externas transferidas para o celular).

```js
const { status } = await MediaLibrary.requestPermissionsAsync();
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 0.8,
});
```

---

### 5. Safe Area — `react-native-safe-area-context`

**Onde:** `App.js` (provider), todos os headers customizados

Garante que a interface **não sobreponha a barra de status do sistema** em dispositivos com câmera perfurada, notch ou indicador de gesto (como o Google Pixel 9 Pro). O `useSafeAreaInsets()` lê os insets reais do dispositivo em tempo de execução.

```js
// App.js
<SafeAreaProvider><AppNavigator /></SafeAreaProvider>

// Telas com header customizado
const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top + 12 }}>
```

---

## Estrutura de Dados no Firebase

```
(root)
├── satellites/
│   └── {id}/
│       ├── name, constellation, operator, launchDate
│       ├── altitude, inclination, raan, eccentricity, period
│       ├── status: "operational" | "warning" | "critical" | "inactive"
│       └── lat, lon, mass, updatedAt
│
├── debris/
│   └── {id}/
│       ├── name, origin, catalogId
│       ├── altitude, inclination, velocity, size
│       ├── riskLevel: "critical" | "high" | "medium" | "low"
│       └── detectedAt, updatedAt
│
├── alerts/
│   └── {pushId}/
│       ├── type: "collision" | "conjunction" | "reentry"
│       ├── severity: "critical" | "warning" | "info"
│       ├── satelliteId, satelliteName, debrisId, debrisName
│       ├── probability, missDistance, timeToClosestApproach
│       ├── status: "active" | "monitoring" | "resolved"
│       └── createdAt
│
├── maneuvers/
│   └── {pushId}/
│       ├── satelliteId, satelliteName, alertId
│       ├── type: "Queima Evasiva" | "Boost Orbital" | ...
│       ├── deltaV, duration, note
│       ├── status: "scheduled" | "executing" | "completed" | "failed"
│       └── createdAt
│
└── gallery/
    └── {pushId}/
        ├── uri, source: "camera" | "gallery"
        ├── caption, satellite
        └── createdAt
```

---

## Instruções de Execução

### Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 18+ |
| Android Studio | Hedgehog (2023.1) ou superior |
| Emulador Android | API Level 33+ (Android 13) |
| JDK | 17 |

### Passo 1 — Instalar dependências

```bash
git clone https://github.com/seu-usuario/space-tracker.git
cd space-tracker
npm install
```

### Passo 2 — Configurar Firebase

> **Obrigatório** — sem as regras abertas, o app não consegue ler nem gravar dados.

Acesse o console do projeto Firebase e abra **Realtime Database → Regras**:

```
https://console.firebase.google.com/project/fiap-mobile-b1d17/database/fiap-mobile-b1d17-default-rtdb/rules
```

Publique:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Passo 3 — Executar no Android Studio

```bash
# Inicia o app diretamente no emulador Android
npx expo start --android
```

O Metro Bundler iniciará e o APK de desenvolvimento será instalado automaticamente no emulador.

### Passo 4 — Executar em dispositivo físico (opcional)

```bash
npx expo start
```

Instale o **Expo Go** no celular e escaneie o QR Code exibido no terminal.

> **Nota sobre permissões no dispositivo físico:** ao abrir as telas de Localização e Galeria pela primeira vez, o sistema solicitará as permissões de GPS, Câmera e Galeria. É necessário concedê-las para o funcionamento completo dos recursos mobile.

### Passo 5 — Dados de demonstração

Na primeira execução, o app popula automaticamente o Firebase com **dados simulados realistas** baseados em TLEs públicos (Celestrak/Space-Track):

- 6 satélites de múltiplas constelações (Starlink, OneWeb, GPS, INPE)
- 5 detritos catalogados com diferentes níveis de risco
- 3 alertas ativos (1 crítico, 1 warning, 1 monitoramento)

Nenhuma configuração adicional é necessária.

---

## Tecnologias

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React Native | 0.81 | Framework mobile multiplataforma |
| Expo | 54 | Toolchain + APIs nativas |
| JavaScript | ES2022 | Linguagem principal |
| Firebase Realtime DB | 12 | Banco de dados em tempo real |
| React Navigation | 7 | Stack + Bottom Tabs |
| expo-location | 18 | GPS e localização |
| expo-camera / image-picker | 16 | Câmera e galeria |
| expo-notifications | 0.29 | Alertas push locais |
| expo-media-library | 17 | Acesso à galeria do dispositivo |
| react-native-safe-area-context | 5 | Insets dinâmicos por dispositivo |

---

<div align="center">
  <sub>Space Tracker · FIAP Mobile Development & IoT 2026</sub>
</div>
