import plugin from "../plugin.json";
let AppSettings = acode.require("settings");

class AcodePlugin {
 
  async init() {
    let acodeLanguageClient = acode.require("acode-language-client");
    if (acodeLanguageClient) {
      await this.setupLangaugeClient(acodeLanguageClient);
    } else {
      window.addEventListener("plugin.install", ({ detail }) => {
        if (detail.name == "acode-language-client") {
          acodeLanguageClient = acode.require("acode-language-client");
          this.setupLangaugeClient(acodeLanguageClient);
          
        }
      });
    }
  }
  
  async setupLangaugeClient(acodeLanguageClient) {
    let ymlsocket = (this.socket = acodeLanguageClient.getSocketForCommand(
      this.settings.serverPath, ["--stdio"]
    ));
    let ymlClient = new acodeLanguageClient.LanguageClient({
      type: "socket",
      socket: ymlsocket,
    });
    acodeLanguageClient.registerService("yaml|yml", ymlClient);
    acode.registerFormatter("yaml Language Server", ["yml", "yaml"], () =>
      acodeLanguageClient.format(),
    );
  }
  get settingsMenuLayout() {
    return {
      list: [
        {
          index: 0,
          key: "serverPath",
          promptType: "text",
          prompt:"Change the serverPath before running.",
          text: "Yaml Executable File Path",
          value: this.settings.serverPath,
        },
      ],
      
      cb: (key, value) => {
        AppSettings.value[plugin.id][key] = value;
        AppSettings.update();
      },
    };
  }
  
  get settings() {
    if (!window.acode) {
      return this.defaultSettings;
    }
    let value = AppSettings.value[plugin.id];
    if (!value) {
      value = AppSettings.value[plugin.id] = this.defaultSettings;
      AppSettings.update();
    }
    return value;
  }
  get defaultSettings() {
    return {
      serverPath:
        "yaml-language-server",
    };
  }
  async destroy() {}
}

if (window.acode) {
  const acodePlugin = new AcodePlugin();
  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      acodePlugin.baseUrl = baseUrl;
      await acodePlugin.init($page, cacheFile, cacheFileUrl);
    },
    acodePlugin.settingsMenuLayout,
  );

  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
