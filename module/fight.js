// Import actors & items
import {FightActor} from "./actor/actor.js";
import {FightItem} from "./item/item.js";

// Import actor & item sheets
import {FightItemSheet} from "./item/item-sheet.js";
import {FightActorSheet} from "./actor/actor-sheet.js";
import {FightActorSheetPC} from "./actor/pc-sheet.js";
import {FightActorSheetNPC} from "./actor/npc-sheet.js";
import {FightActorSheetCommunity} from "./actor/community-sheet.js";
import {FightActorSheetCompanion} from "./actor/companion-sheet.js";
import {FightActorSheetMarker} from "./actor/marker-sheet.js";
import {FightActorSheetVehicle} from "./actor/vehicle-sheet.js";

// Import utility functions
import {preloadTemplates} from "./utilities/template-paths.js";
import {
  applyXPFromIntrusion,
  regainPoolPoints
} from "./utilities/actor-utilities.js";
import {sendWelcomeMessage} from "./utilities/welcome-message.js";
import {createFightMacro} from "./utilities/create-macros.js";

// Import macros
import {
  quickRollMacro,
  easedRollMacro,
  hinderedRollMacro,
  diceRollMacro,
  recoveryRollMacro,
  spendEffortMacro,
  allInOneRollDialog,
  itemRollMacro,
  toggleDragRuler,
  resetDragRulerDefaults,
  resetBarBrawlDefaults,
  removeBarBrawlSettings,
  quickStatChange,
  proposeIntrusion,
  changeSymbolForFractions,
  toggleAlwaysShowDescriptionOnRoll,
  calculateAttackDifficulty,
  recursionMacro,
  tagMacro,
  disasterModeMacro,
  lockStaticStatsMacro,
  migrateDataMacro,
  selectedTokenRollMacro,
  allInOneRollDialogV2
} from "./macros/macros.js";
import {
  easedRollEffectiveMacro,
  hinderedRollEffectiveMacro,
  renameTagMacro,
  translateToRecursion,
  archiveStatusByTag
} from "./macros/macro-helper.js";
import {
  chatCardMarkItemIdentified,
  chatCardProposeIntrusion,
  chatCardAskForIntrusion,
  chatCardIntrusionAccepted,
  chatCardIntrusionRefused,
  chatCardWelcomeMessage,
  chatCardRegainPoints
} from "./utilities/chat-cards.js";
import {barBrawlOverwrite} from "./utilities/token-utilities.js";
import {registerGameSettings} from "./utilities/game-settings.js";
import {registerHandlebars} from "./utilities/handlebars.js";
import {gameSockets} from "./utilities/game-sockets.js";
import {initiativeSettings} from "./utilities/initiative-settings.js";
import {dataMigration, dataMigrationPacks} from "./utilities/migration.js";
import {rollEngineMain} from "./utilities/roll-engine/roll-engine-main.js";
import {rollEngineComputation} from "./utilities/roll-engine/roll-engine-computation.js";
import {rollEngineForm} from "./utilities/roll-engine/roll-engine-form.js";
import {rollEngineOutput} from "./utilities/roll-engine/roll-engine-output.js";
import {gmiRangeForm, renderGMIForm} from "./forms/gmi-range-sheet.js";
import {changeTagStats} from "./utilities/tagging-engine/tagging-engine-computation.js";
import {renderRollDifficultyForm} from "./forms/roll-difficulty-sheet.js";
import {
  changePortraitAndToken,
  executeSeriesOfMacros,
  payCostWithAdditionalPool,
  payXP,
  useAmmo
} from "./macros/macros-scripting.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.log("Initializing Fight System");

  // CONFIG.debug.hooks = true;

  const recursionDocumentLinkExceptions = [
    "@macro",
    "@actor",
    "@scene",
    "@item",
    "@rolltable",
    "@journalentry",
    "@cards",
    "@playlist",
    "@playlistsound",
    "@compendium",
    "@pdf",
    "@uuid"
  ];

  game.Fight = {
    // Actor sheets
    FightActor,
    FightItem,
    FightActorSheet,
    FightActorSheetPC,
    FightActorSheetNPC,
    FightActorSheetCommunity,
    FightActorSheetCompanion,
    FightActorSheetVehicle,
    FightActorSheetMarker,
    FightItemSheet,

    // Macros
    quickRollMacro,
    easedRollMacro,
    hinderedRollMacro,
    diceRollMacro,
    recoveryRollMacro,
    spendEffortMacro,
    itemRollMacro,
    allInOneRollDialog,
    allInOneRollDialogV2,
    toggleDragRuler,
    resetDragRulerDefaults,
    resetBarBrawlDefaults,
    removeBarBrawlSettings,
    quickStatChange,
    proposeIntrusion,
    changeSymbolForFractions,
    toggleAlwaysShowDescriptionOnRoll,
    calculateAttackDifficulty,
    recursionMacro,
    tagMacro,
    disasterModeMacro,
    lockStaticStatsMacro,
    migrateDataMacro,
    dataMigrationPacks,
    rollEngineMain,
    rollEngineComputation,
    rollEngineForm,
    rollEngineOutput,
    selectedTokenRollMacro,

    // Scripting macros
    useAmmo,
    payCostWithAdditionalPool,
    payXP,
    executeSeriesOfMacros,
    changePortraitAndToken,

    // Deprecated macros
    easedRollEffectiveMacro,
    hinderedRollEffectiveMacro,
    archiveStatusByTag,
    translateToRecursion,
    renameTagMacro,

    // Chat cards
    chatCardMarkItemIdentified,
    chatCardProposeIntrusion,
    chatCardAskForIntrusion,
    chatCardIntrusionAccepted,
    chatCardIntrusionRefused,
    chatCardWelcomeMessage,
    chatCardRegainPoints,

    // Recursion Document Link Exceptions
    recursionDocumentLinkExceptions
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass = FightActor;
  CONFIG.Item.documentClass = FightItem;

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("Fight", FightActorSheetPC, {
    types: ['pc'],
    makeDefault: true,
    label: "Fight.SheetClassPC"
  });
  foundry.documents.collections.Actors.registerSheet("Fight", FightActorSheetNPC, {
    types: ['npc'],
    makeDefault: true,
    label: "Fight.SheetClassNPC"
  });
  foundry.documents.collections.Actors.registerSheet("Fight", FightActorSheetMarker, {
    types: ['marker'],
    makeDefault: true,
    label: "Fight.SheetClassToken"
  });
  foundry.documents.collections.Actors.registerSheet("Fight", FightActorSheetCommunity, {
    types: ['community'],
    makeDefault: true,
    label: "Fight.SheetClassCommunity"
  });
  foundry.documents.collections.Actors.registerSheet("Fight", FightActorSheetCompanion, {
    types: ['companion'],
    makeDefault: true,
    label: "Fight.SheetClassCompanion"
  });
  foundry.documents.collections.Actors.registerSheet("Fight", FightActorSheetVehicle, {
    types: ['vehicle'],
    makeDefault: true,
    label: "Fight.SheetClassVehicle"
  });
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("Fight", FightItemSheet, {
    makeDefault: true,
    label: "Fight.SheetClassItem"
  });

  // Load initiative settings
  initiativeSettings();

  // Register system settings
  registerGameSettings();

  // Register HTML-Handlebars
  registerHandlebars();

  // Pre-load HTML templates
  preloadTemplates();

  // Load game sockets
  gameSockets();
});

Hooks.on("canvasReady", function (canvas) {
  console.log(`The canvas was just rendered for scene: ${canvas.scene.id}`);
  for (let t of game.scenes.viewed.tokens) {
    if (t.getFlag("Fight", "toggleDragRuler") !== undefined) {
      // do nothing
    } else {
      if (t.actor.type !== "marker" && t.actor.type !== "vehicle") {
        t.setFlag("Fight", "toggleDragRuler", true);
      } else {
        t.setFlag("Fight", "toggleDragRuler", false);
      }
    }
  }

  // if (game.user.isGM) {
  //   document.documentElement.style.setProperty('--Fight-font', 'Comic Sans MS, sans-serif');
  // }
});

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (data.type === "Item") {
      createFightMacro(data, slot);
      return false;
    }
  });

  // Migrate actor data
  await dataMigration();

  // Send warning for people with CSRD Compendium v3.2.0
  if (game.modules.get("Fight-compendium")?.version == "v3.2.0") {
    ui.notifications.error(
      "There has been a bug in the update process for the Fight SRD Compendium. Please uninstall and reinstall the module in the Foundry setup to get the newest version. Sorry for the inconvenience! –Marko",
      {
        permanent: true,
        console: true
      }
    );
  }

  // Send warning for people with Fightsheets module version 0.3.3 or lower
  let FightSheetsVersion = game.modules.get("Fightsheets")?.version;
  if (FightSheetsVersion && game.modules.get("Fightsheets")?.active) {
    let versionParts = FightSheetsVersion.substring(1).split(".").map(Number);
    if (
      versionParts[0] < 0 ||
      (versionParts[0] === 0 && versionParts[1] <= 3) ||
      (versionParts[0] === 0 && versionParts[1] === 3 && versionParts[2] <= 3)
    ) {
      ui.notifications.error(
        "The Fight System Custom Sheets module hasn’t been updated in a while and isn’t compatible with the current version of the Fight System. Please disable the Custom Sheets module. You can customize PC sheets in the settings tab and all other sheets in the system settings. –Marko",
        {
          permanent: true,
          console: true
        }
      );
    }
  }

  // Send welcome message
  if (game.settings.get("Fight", "welcomeMessage")) sendWelcomeMessage();
});

Hooks.on("getSceneControlButtons", (controls) => {
  controls.tokens.tools.rollDifficulty = {
    name: "rollDifficulty",
    title: game.i18n.localize("Fight.DifficultyControlPanel"),
    icon: "fa-solid fa-crosshairs-simple",
    onChange: (event, active) => {
      renderRollDifficultyForm(true);
    },
    button: true
  };
  if (game.user.isGM) {
    controls.tokens.tools.calculateDifficulty = {
      name: "calculateDifficulty",
      title: game.i18n.localize("Fight.CalculateAttackDifficulty"),
      icon: "fas fa-calculator",
      onChange: (event, active) => {
        calculateAttackDifficulty();
      },
      button: true
    };
  }
  controls.tokens.tools.gmiRange = {
    name: "gmiRange",
    title: game.i18n.localize("Fight.GMIRange"),
    icon: "fas fa-exclamation-triangle",
    onChange: (event, active) => {
      gmiRangeForm();
    },
    button: true
  };
  if (game.user.isGM) {
    controls.tokens.tools.proposeGMI = {
      name: "proposeGMI",
      title: game.i18n.localize("Fight.ProposeIntrusion"),
      icon: "fas fa-bolt",
      onChange: (event, active) => {
        proposeIntrusion("", "");
      },
      button: true
    };
  }
});

Hooks.on("preCreateActor", async function (actor) {
  if (["pc", "community"].includes(actor.type)) {
    actor.updateSource({
      "prototypeToken.actorLink": true
    });
  } else if (actor.type == "npc") {
    actor.updateSource({
      "prototypeToken.bar1": {
        attribute: "pools.health"
      },
      "prototypeToken.bar2": {
        attribute: "basic.level"
      }
    });
  } else if (actor.type == "companion") {
    actor.updateSource({
      "prototypeToken.bar1": {
        attribute: "pools.health"
      },
      "prototypeToken.bar2": {
        attribute: "basic.level"
      },
      "prototypeToken.actorLink": true
    });
  } else if (actor.type == "marker") {
    actor.updateSource({
      "prototypeToken.bar1": {
        attribute: "pools.quantity"
      },
      "prototypeToken.bar2": {
        attribute: "basic.level"
      }
    });
  }
});

Hooks.on("updateActor", async function (actor, data, options, userId) {
  if (actor.type == "pc" && data.ownership) {
    game.socket.emit("system.Fight", {
      operation: "renderGMIForm"
    });
    renderGMIForm();
  }
});

Hooks.on("preCreateItem", function (item, data, options, id) {
  if (item.img == "icons/svg/item-bag.svg") {
    item.updateSource({
      img: `systems/Fight/icons/items/${item.type}.svg`
    });
  }
  if (
    item.parent?.system.basic.unmaskedForm == "Teen" &&
    ["ability", "armor", "attack", "lasting-damage", "skill"].includes(
      item.type
    )
  ) {
    item.updateSource({
      "system.settings.general.unmaskedForm": "Teen"
    });
  }
  if (item.flags.Fight?.tags) {
    item.updateSource({
      "flags.Fight.tags": []
    });
  }
  if (item.flags.Fight?.recursions) {
    item.updateSource({
      "flags.Fight.recursions": []
    });
  }
  if (item.system?.archived || item.system?.favorite) {
    item.updateSource({
      "system.archived": false,
      "system.favorite": false
    });
  }
});

Hooks.on("preUpdateItem", async function (item, changes, options, userId) {
  if (
    item.actor &&
    ["tag", "recursion"].includes(item.type) &&
    changes?.system?.settings?.statModifiers &&
    item.system.active
  ) {
    let statModifiers = item.system.settings.statModifiers;
    let changedStatModifiers = changes.system?.settings?.statModifiers;

    let mightModifier =
      changedStatModifiers?.might?.value - statModifiers.might.value || 0;
    let mightEdgeModifier =
      changedStatModifiers?.might?.edge - statModifiers.might.edge || 0;
    let speedModifier =
      changedStatModifiers?.speed?.value - statModifiers.speed.value || 0;
    let speedEdgeModifier =
      changedStatModifiers?.speed?.edge - statModifiers.speed.edge || 0;
    let intellectModifier =
      changedStatModifiers?.intellect?.value - statModifiers.intellect.value ||
      0;
    let intellectEdgeModifier =
      changedStatModifiers?.intellect?.edge - statModifiers.intellect.edge || 0;

    await changeTagStats(fromUuidSync(item.actor.uuid), {
      mightModifier: mightModifier,
      mightEdgeModifier: mightEdgeModifier,
      speedModifier: speedModifier,
      speedEdgeModifier: speedEdgeModifier,
      intellectModifier: intellectModifier,
      intellectEdgeModifier: intellectEdgeModifier,
      itemActive: !item.system.active
    });
  }
});

Hooks.on("updateItem", async function (item, changes, options, userId) {});

Hooks.on("preCreateToken", function (document, data) {
  if (!data.actorId) return;
  let actor = game.actors.get(data.actorId);

  // Support for Ruler
  if (actor.type == "marker" || actor.type == "community") {
  }

  // Support for Bar Brawl
  if (
    game.modules.get("barbrawl")?.active &&
    game.settings.get("Fight", "barBrawlDefaults")
  ) {
    barBrawlOverwrite(document, actor);
  }
});

Hooks.on("createCombatant", function (combatant) {
  if (game.user.isGM) {
    let actor = combatant.actor;

    if (
      game.settings.get("Fight", "difficultyNPCInitiative") &&
      game.settings.get("Fight", "rollDifficulty") >= 0
    ) {
      var NPCInitiative = game.settings.get("Fight", "rollDifficulty");
    } else {
      var NPCInitiative =
        actor.type == "community"
          ? actor.system.basic.rank
          : actor.system.basic.level;
    }

    if (actor.type == "npc") {
      combatant.update({
        initiative:
          NPCInitiative * 3 +
          actor.system.settings.general.initiativeBonus -
          0.5 +
          actor.system.basic.level / 1000
      });
    } else if (actor.type == "community" && !combatant.hasPlayerOwner) {
      combatant.update({
        initiative:
          NPCInitiative * 3 +
          actor.system.settings.general.initiativeBonus -
          0.5 +
          actor.system.basic.rank / 1000
      });
    } else if (actor.type == "community" && combatant.hasPlayerOwner) {
      combatant.update({
        initiative:
          actor.system.basic.rank * 3 +
          actor.system.settings.general.initiativeBonus
      });
    } else if (actor.type == "vehicle") {
      combatant.update({
        initiative: NPCInitiative * 3 - 0.5 + actor.system.basic.level / 1000
      });
    }
  }
});

Hooks.on("updateCombat", function () {
  if (game.user.isGM) {
    let combatant = game.combat.combatant ? game.combat.combatant.actor : "";

    if (
      combatant.type == "marker" &&
      combatant.system.settings.general.isCounter == true
    ) {
      let step = !combatant.system.settings.general.counting
        ? -1
        : combatant.system.settings.general.counting;
      let newQuantity = combatant.system.pools.quantity.value + step;
      combatant.update({
        "system.pools.quantity.value": newQuantity
      });
    }
  }
});

Hooks.on("renderChatMessage", function (message, html, data) {
  // Hide buttons
  if (html.find(".chat-card-buttons").data("actor")) {
    let actor = game.actors.get(html.find(".chat-card-buttons").data("actor"));
    if (!actor.isOwner)
      html.find("div[class='chat-card-buttons']").addClass("chat-hidden");
  }

  // Event Listener to confirm Fight and artifact identification
  html.find(".confirm").click((clickEvent) => {
    if (!game.user.isGM)
      return ui.notifications.warn(
        game.i18n.localize("Fight.OnlyGMCanIdentify")
      );
    let actor = game.actors.get(html.find(".confirm").data("actor"));
    let item = actor.items.get(html.find(".confirm").data("item"));
    item.update({
      "system.basic.identified": true
    });
    ui.notifications.info(
      game.i18n.format("Fight.ConfirmIdentification", {
        item: item.name,
        actor: actor.name
      })
    );
  });

  // Event Listener for rerolls of stat rolls
  html.find(".reroll-stat").click((clickEvent) => {
    let user = html.find(".reroll-stat").data("user");
    if (user !== game.user.id)
      return ui.notifications.warn(
        game.i18n.localize("Fight.WarnRerollUser")
      );
    const data = html.find(".reroll-stat").data("data");
    delete data["skipDialog"];
    delete data["roll"];
    data.reroll = true;
    rollEngineMain(data);
  });

  // Event Listener for rerolls of recovery rolls
  html.find(".reroll-recovery").click((clickEvent) => {
    let user = html.find(".reroll-recovery").data("user");
    if (user !== game.user.id)
      return ui.notifications.warn(
        game.i18n.localize("Fight.WarnRerollUser")
      );
    let dice = html.find(".reroll-recovery").data("dice");
    let actorUuid = html.find(".reroll-recovery").data("actor-uuid");
    let actor = actorUuid.includes("Token")
      ? fromUuidSync(actorUuid).actor
      : fromUuidSync(actorUuid);
    recoveryRollMacro(actor, dice, false);
  });

  // Event Listener for rerolls of dice rolls
  html.find(".reroll-dice-roll").click((clickEvent) => {
    let user = html.find(".reroll-dice-roll").data("user");
    if (user !== game.user.id)
      return ui.notifications.warn(
        game.i18n.localize("Fight.WarnRerollUser")
      );
    let dice = html.find(".reroll-dice-roll").data("dice");
    diceRollMacro(dice);
  });

  // Event Listener to regain pool points
  html.find(".regain-points").click((clickEvent) => {
    let user = html.find(".regain-points").data("user");
    if (user !== game.user.id)
      return ui.notifications.warn(
        game.i18n.localize("Fight.WarnRerollUser")
      );
    let actorUuid = html.find(".regain-points").data("actor-uuid");
    let actor = actorUuid.includes("Token")
      ? fromUuidSync(actorUuid).actor
      : fromUuidSync(actorUuid);
    let cost = html.find(".regain-points").data("cost");
    let pool = html.find(".regain-points").data("pool");
    let teen = html.find(".regain-points").data("teen");
    regainPoolPoints(actor, cost, pool, teen);
  });

  // Event Listener for description in chat
  html.find(".chat-description").click((clickEvent) => {
    const description = html.find(".chat-card-item-description");
    if (description.hasClass("expanded")) {
      description.slideUp();
      description.toggleClass("expanded");
    } else {
      description.slideDown();
      description.toggleClass("expanded");
    }
  });

  // Event Listener for difficulty details in chat
  html.find(".roll-result-difficulty").click((clickEvent) => {
    const description = html.find(".roll-result-difficulty-details");
    if (description.hasClass("expanded")) {
      description.slideUp();
      description.toggleClass("expanded");
    } else {
      description.slideDown();
      description.toggleClass("expanded");
    }
  });

  // Event Listener for damage details in chat
  html.find(".roll-result-damage").click((clickEvent) => {
    const description = html.find(".roll-result-damage-details");
    if (description.hasClass("expanded")) {
      description.slideUp();
      description.toggleClass("expanded");
    } else {
      description.slideDown();
      description.toggleClass("expanded");
    }
  });

  // Event Listener for damage details in chat
  html.find(".roll-result-cost").click((clickEvent) => {
    const description = html.find(".roll-result-cost-details");
    if (description.hasClass("expanded")) {
      description.slideUp();
      description.toggleClass("expanded");
    } else {
      description.slideDown();
      description.toggleClass("expanded");
    }
  });

  // Event Listener for accepting intrusions
  html.find(".accept-intrusion").click((clickEvent) => {
    let actor = game.actors.get(html.find(".accept-intrusion").data("actor"));
    if (!actor.isOwner)
      return ui.notifications.warn(
        game.i18n.format("Fight.IntrusionWrongPlayer", {
          actor: actor.name
        })
      );

    // Create list of PCs
    let list = "";
    for (let actor of game.actors.contents) {
      if (
        actor.type === "pc" &&
        actor._id != html.find(".accept-intrusion").data("actor") &&
        actor.hasPlayerOwner
      ) {
        let owners = "";
        for (let user of game.users.contents) {
          if (!user.isGM) {
            let ownerID = user._id;
            if (actor.ownership[ownerID] == 3) {
              owners = owners == "" ? user.name : owners + ", " + user.name;
            }
          }
        }
        list =
          list +
          `<option value=${actor._id}>${actor.name} (${owners})</option>`;
      }
    }

    // Create dialog content
    let content =
      `<div align="center"><label style="display: inline-block; text-align: right"><b>${game.i18n.localize("Fight.GiveAdditionalXPTo")}: </b></label>
    <select name="selectPC" id="selectPC" style="width: auto; margin-left: 5px; margin-bottom: 5px; text-align-last: center">` +
      list +
      `</select></div>`;

    // Create dialog
    let d = new Dialog({
      title: game.i18n.localize("Fight.GiveAdditionalXP"),
      content: content,
      buttons: {
        apply: {
          icon: '<i class="fa-item fas fa-check"></i>',
          label: game.i18n.localize("Fight.Apply"),
          callback: (html) =>
            applyXPFromIntrusion(
              actor,
              html.find("#selectPC").val(),
              data.message._id,
              1
            )
        },
        cancel: {
          icon: '<i class="fa-item fas fa-times"></i>',
          label: game.i18n.localize("Fight.Cancel"),
          callback: () => {}
        }
      },
      default: "apply",
      close: () => {}
    });
    if (list == "") {
      applyXPFromIntrusion(actor, "", data.message._id, 1);
    } else {
      d.render(true, {
        width: "auto"
      });
    }
  });

  // Event Listener for refusing intrusions
  html.find(".refuse-intrusion").click((clickEvent) => {
    let actor = game.actors.get(html.find(".refuse-intrusion").data("actor"));
    if (!actor.isOwner)
      return ui.notifications.warn(
        game.i18n.format("Fight.IntrusionWrongPlayer", {
          actor: actor.name
        })
      );
    applyXPFromIntrusion(actor, "", data.message._id, -1);
  });
});

Hooks.once("dragRuler.ready", (SpeedProvider) => {
  class FightSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        {
          id: "immediate",
          default: 0x0000ff,
          name: "immediate"
        },
        {
          id: "short",
          default: 0x008000,
          name: "short"
        },
        {
          id: "long",
          default: 0xffa500,
          name: "long"
        },
        {
          id: "veryLong",
          default: 0xff0000,
          name: "very long"
        }
      ];
    }

    getRanges(token) {
      let immediate = 0;
      let short = 0;
      let long = 0;
      let veryLong = 0;
      if (
        ["m", "meter", "metre"].includes(token.scene.grid.units) ||
        token.scene.grid.units ==
          game.i18n.localize("Fight.UnitDistanceMeter")
      ) {
        immediate = 3;
        short = 15;
        long = 30;
        veryLong = 150;
      } else if (
        ["ft", "ft.", "feet"].includes(token.scene.grid.units) ||
        token.scene.grid.units ==
          game.i18n.localize("Fight.UnitDistanceFeet")
      ) {
        immediate = 10;
        short = 50;
        long = 100;
        veryLong = 500;
      }

      const ranges = [
        {
          range: immediate,
          color: "immediate"
        },
        {
          range: short,
          color: "short"
        },
        {
          range: long,
          color: "long"
        },
        {
          range: veryLong,
          color: "veryLong"
        }
      ];
      return ranges;
    }

    get defaultUnreachableColor() {
      return 0x000000;
    }

    usesRuler(token) {
      if (token.document.flags.Fight.toggleDragRuler) {
        return true;
      } else {
        return false;
      }
    }
  }

  dragRuler.registerSystem("Fight", FightSpeedProvider);
});

Hooks.on("renderTokenConfig", function (tokenConfig, html, data) {
  if (
    game.modules.get("barbrawl")?.active &&
    game.settings.get("Fight", "barBrawlDefaults")
  ) {
    html.find("a[data-tab='resources']").addClass("hidden");
  }
});
