# gwent-classic
![cover](https://user-images.githubusercontent.com/26311830/116256903-f1599b00-a7b6-11eb-84a1-16dcb5c9bfc6.jpg)

A browser remake of the original Gwent minigame from The Witcher 3: Wild Hunt including all cards from the DLC. To play, download the repo and open index.html in a browser. For the best experience, play in fullscreen which can be toggled in most browsers with F11.

## Rules
The game is played in the same way as the original. The player aims to win two of three rounds, where victory within a given round is determined by whoever scores the most points. 

#### Cards and Points
Points are obtained by placing down unit cards, each with their corresponding values. Some unit cards have special effects as denoted by a symbol on their left side. The cards and their effects can be examined by selecting them or the row they have been palced on. The game also includes a nubmer of special cards that apply effects like negative weather conditions or bosting card points when played.

#### Turns
A turn consists of playing a single card. Your opponent then does the same until either one of you passes. At this point the remaining player can continue to place cards until they decide to pass. When both players have passed the round is ended. In addition of placing cards, they player may also activate their leader ability by clicking on their leader if it is available to them.

#### Factions
The faction you pick will affect your game in three ways. It limits the specific cards you can use to neutral cards, special cards, and the unit cards in your faction. This includes the leader card that you can pick and the corresponding leader ability. Each faction also has a special effect that is displayed when selecting a faction and at the top of the customization screen for the currently selected faction.

## Features
#### All cards from the TW3 + DLC + NextGen
All cards from the base games and DLC can be used by you and the AI. This includes the additions from Hearts of Stone and Skellige as a playable deck from Blood and Wine. As of the next-gen update, the Roach card is now also included, along with adding the muster ability to the Geralt and Ciri cards. The total count of cards available corresponds to the number you can find in the original game.

#### Faithful to the original minigame
This remake aims to resemble the orignal minigame as closely as possible from the font to the UI layout and notifications. Some changes have been made in the form of buttons for settings, exiting a game, and passing your current turn. The deck customization screen also includes changes to upload and download decks, including being able to upload a custom opponent deck.

#### AI opponent
When you start a game you will face off againsts a fully implemented AI oponent. The opponent uses premade decks and will make intelligent decisions based on the cards in its hand, on the table, and in the discard piles.

#### Customize, save and upload decks
You can select a faction to play as at the top of the screen and then add and remove cards from your deck by clicking on the cards in either scroll-down menu. You can also pick a leader card by selecting the current leader and scrolling through the options for that faction. At the top of the screen there are buttons to upload and download decks to play with. These are stored in json format and are checked to see if they comply with their assigned faction and maximum card counts. At the bottom of the screen, you can also customize your opponent by uploading the deck they will play with. 

#### Persistent settings
The game has settings for toggling music, sound effects and showing the in-game notifications. These settings along with customizations like your faction decks are saved in the browser meaning that you can change faction, reload the page, or close the browser, and your settings will be remembered.

#### Music tracks
The gwent music tracks are streamed from YouTube and can be toggled by pressing the music icon in the center of the customization screen or the bottom-left of the game screen. For some browsers, the page may need to be refreshed once before the music can be activated.

#### Sound effects
Most sound effects for gameplay and menus have been added and integrated and can be toggled of via the speaker button. Courtesy of [RandomPianist](https://github.com/RandomPianist/gwent-classic-v3.1) for providing many of the sound effects that I have since edited for this version.
