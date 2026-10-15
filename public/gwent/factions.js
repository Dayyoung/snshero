"use strict"

var factions = {
	realms: {
		name: "Northern Realms",
		title_ko: "북부 왕국 (Northern Realms)",
		title_en: "Northern Realms",
		name_ko: "북부 왕국 (Northern Realms)",
		name_en: "Northern Realms",
		description: "Draw a card from your deck whenever you win a round.",
		desc_ko: "라운드에서 승리할 때마다 덱에서 카드를 1장 추가로 뽑습니다.",
		desc_en: "Draw a card from your deck whenever you win a round.",
		lore_ko: "라운드에서 승리할 때마다 덱에서 카드를 1장 추가로 뽑습니다.",
		lore_en: "Draw a card from your deck whenever you win a round.",
		factionAbility: player => game.roundStart.push( async () => {
			if (game.roundCount > 1 && game.roundHistory[game.roundCount-2].winner === player) {
				player.deck.draw(player.hand);
				await ui.notification("north", 1200);
			}
			return false;
		})
	},
	nilfgaard: {
		name: "Nilfgaardian Empire",
		title_ko: "닐프가드 제국 (Nilfgaard)",
		title_en: "Nilfgaardian Empire",
		name_ko: "닐프가드 제국 (Nilfgaard)",
		name_en: "Nilfgaardian Empire",
		description: "Wins any round that ends in a draw.",
		desc_ko: "라운드가 무승부(동점)로 끝날 경우 승리로 판정됩니다.",
		desc_en: "Wins any round that ends in a draw.",
		lore_ko: "라운드가 무승부(동점)로 끝날 경우 승리로 판정됩니다.",
		lore_en: "Wins any round that ends in a draw."
	},
	monsters: {
		name: "Monsters",
		title_ko: "괴물 군단 (Monsters)",
		title_en: "Monsters",
		name_ko: "괴물 군단 (Monsters)",
		name_en: "Monsters",
		description: "Keeps a random Unit Card out after each round.",
		desc_ko: "각 라운드 종료 시 무작위 유닛 카드 1장을 다음 라운드에 잔류시킵니다.",
		desc_en: "Keeps a random Unit Card out after each round.",
		lore_ko: "각 라운드 종료 시 무작위 유닛 카드 1장을 다음 라운드에 잔류시킵니다.",
		lore_en: "Keeps a random Unit Card out after each round.",
		factionAbility: player => game.roundEnd.push(() => {
			const units = board.row.filter( (r,i) => player === player_me ^ i < 3)
				.reduce((a,r) => r.cards.filter(c => c.isUnit()).concat(a), []);
			if (units.length === 0)
				return;
			const card = units[randomInt(units.length)];
			card.noRemove = true;
			game.roundStart.push( async () => {
				await ui.notification("monsters", 1200);
				delete card.noRemove;
				return true; 
			});
			return false;
		})
	},
	scoiatael: {
		name: "Scoia'tael",
		title_ko: "스코이아'텔 (Scoia'tael)",
		title_en: "Scoia'tael",
		name_ko: "스코이아'텔 (Scoia'tael)",
		name_en: "Scoia'tael",
		description: "Decides who takes first turn.",
		desc_ko: "게임 시작 시 선공 또는 후공 여부를 자유롭게 결정합니다.",
		desc_en: "Decides who takes first turn.",
		lore_ko: "게임 시작 시 선공 또는 후공 여부를 자유롭게 결정합니다.",
		lore_en: "Decides who takes first turn.",
		factionAbility: player => game.gameStart.push( async () => {
			let notif = "";
			if (player === player_me) {
				await ui.popup("Go First", () => game.firstPlayer = player, "Let Opponent Start", () => game.firstPlayer = player.opponent(), "Would you like to go first?", "The Scoia'tael faction perk allows you to decide who will get to go first.", 0.55);
				notif = game.firstPlayer.tag + "-first";
			} else if (player.hand instanceof HandAI) {
				if (Math.random() < 0.5) {
					game.firstPlayer = player;
					notif = "scoiatael";
				} else {
					game.firstPlayer = player.opponent();
					notif = game.firstPlayer.tag + "-first";
				}
			} else {
				//sleepUntil(game.firstPlayer); //TODO online
			}
			await ui.notification(notif,1200);
			return true;
		})
	},
	skellige: {
		name: "Skellige",
		title_ko: "스켈리게 군도 (Skellige)",
		title_en: "Skellige",
		name_ko: "스켈리게 군도 (Skellige)",
		name_en: "Skellige",
		description: "2 random cards from the graveyard are placed on the battlefield at the start of the third round.",
		desc_ko: "3라운드 시작 시 무덤에 있는 무작위 유닛 카드 2장을 전장에 즉시 부활시킵니다.",
		desc_en: "2 random cards from the graveyard are placed on the battlefield at the start of the third round.",
		lore_ko: "3라운드 시작 시 무덤에 있는 무작위 유닛 카드 2장을 전장에 즉시 부활시킵니다.",
		lore_en: "2 random cards from the graveyard are placed on the battlefield at the start of the third round.",
		factionAbility: player => game.roundStart.push( async () => {
			if (game.roundCount != 3)
				return false;
			const currPlayer = game.currPlayer;
			game.currPlayer = player;
			await ui.notification("skellige-" + player.tag, 1200);
			if (player.controller instanceof ControllerAI)
			{
				await Promise.all(player.grave.findCardsRandom(c => c.isUnit(), 2).map(c => board.toRow(c, player.grave)));
			}
			else
			{
				await factions['skellige'].helper(player);
				await factions['skellige'].helper(player);
			}
			game.currPlayer = currPlayer;
			return true;
		}),
		helper: async player => {
			const units = player.grave.findCardsRandom(c => c.isUnit(), 1);
			if (units.length === 0)
				return;
			const card = units[0];
			if (card.row === 'agile')
			{
				const selectedRow = await ui.waitForRowSelection(card);
				if (selectedRow)
				{
					await board.moveTo(card, selectedRow, player.grave);
				}
			}
			else
			{
				await board.toRow(card, player.grave);
			}
		},
		description: "2 random cards from the graveyard are placed on the battlefield at the start of the third round."
	}
}