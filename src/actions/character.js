import {JOIN, LEAVE, OWN_CHARACTER, UPDATE_OPPONENTS, UPDATE_CHARACTER, SET_TIMER} from './types'
import GameStage from '../components/Game/GameStage';
import Opponent from '../components/Game/Characters/OpponentGuy';
import generateItem from "../components/Game/Items/ItemFactory";

/**
 * Gets called when a user start actively playing the game with his character.
 * charater.playing is used to track the time a user spends playing the game
 */
export function join() {
    return {
        'BAQEND': {
            type: JOIN,
            payload: (db) => db.Character.find().equal('owner', db.User.me).singleResult(character => {
                character.playing = true;
                return character.update();
            })
        }
    }
}

/**
 * Gets called when a user stops actively playing the game with his character, ie when the user logs out.
 * charater.playing is used to track the time a user spends playing the game
 */
export function leave() {
    return {
        'BAQEND': {
            type: LEAVE,
            payload: (db) => db.Character.find().equal('owner', db.User.me).singleResult(character => {
                character.playing = false;
                return character.update();
            })
        }
    }
}

/**
 * Finds the character of the user that is currently logged in
 */
export function character() {
    return {
        'BAQEND': {
            type: OWN_CHARACTER,
            payload: (db) => db.Character.find().equal('owner', db.User.me).singleResult()
        }
    }
}

/**
 * Synchronize position, direction, hp and animation from Baqend Real-Time and
 * gives feedback when the player get timed out wrongly.
 * Uses an eventSream listener, so it updates immediately after update.
 * TODO: refactor this: Bad smells
 *  ~ long method
 *  ~ to many responsibility
 *  ~ inline html / javascript hack
 */
export function updateOpponents() {
    return {
        'BAQEND': {
            type: UPDATE_OPPONENTS,
            payload: (db) => db.Character.find().eventStream().subscribe(character => {
                // Opponent joined the game:
                if (character.data.playing && !GameStage().isConnected(character.data.id)) {
                    let opponent = new Opponent(character.data.x, character.data.y);
                    opponent.id = character.data.id;
                    opponent.direction = character.data.direction;
                    opponent.baseHP = character.data.base_hp;
                    opponent.currentHP = character.data.current_hp;
                    opponent.animation = 'idle';
                    db.User.load(character.data.owner.id).then(user => opponent.rename(user.username));
                    db.Equipment.find().equal('body', character.data).singleResult({depth: 1}).then(equipment => {
                        if (equipment.main_hand !== null) {
                            opponent.weapon = generateItem(equipment.main_hand.name, 0, 0);
                        }
                    });
                    GameStage().link(opponent);
                }
                // Player wrongly timed out:
                else if (!character.data.playing && character.data.id === GameStage().activeObject.id) {
                    // TODO find a way to set the state in Game js, so #game-dimmer becomes true, else use quickfix:
                    if (!document.body.classList.contains('dimmed')) {
                        document.body.innerHTML +=
                            '<div class="">' +
                            '<div data-reactroot="" id="game-dimmer" class="ui active transition visible page dimmer">' +
                            '<div class="content">' +
                            '<div class="center">' +
                            '<h2 class="ui icon inverted header">' +
                            '<i aria-hidden="true" class="time icon"></i>' +
                            'Timed out!' +
                            '<div class="sub header">' +
                            'Please refresh your page and check connection with the Socket.io game-server</div>' +
                            '<br>' +
                            '<button class="ui primary button" onclick=location=\'/\'>' +
                            'refresh' +
                            '</button>' +
                            '</h2>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>';
                        document.body.classList.add('dimmed');
                        document.body.classList.add('dimmable');
                    }
                }
                // opponent already playing, but got new position:
                else if (character.data.playing && character.data.id !== GameStage().activeObject.id) {
                    let opponent = GameStage().networkObjects[character.data.id];
                    opponent.updatePosition(character.data.x, character.data.y);
                    opponent.nextDirection = character.data.direction;
                    opponent.nextAnimation = character.data.animation;
                    opponent.currentHP = character.data.current_hp;
                }
                // opponent left the game:
                else if (!character.data.playing && GameStage().isConnected(character.data.id)) {
                    GameStage().unlink(character.data.id);
                }
            })
        }
    }
}

/**
 * Place the player from last saved position in db,
 * mainly used to place him initially
 */
export function updateCharacter(data) {
    return {
        'BAQEND': {
            type: UPDATE_CHARACTER,
            payload: (db) => db.Character.load(data.id).singleResult(character => {
                character.x = data.x;
                character.y = data.y;
                character.direction = data.direction;
                character.animation = data.animation;
                return character.update();
            })
        }
    }
}

/**
 * Keeps the time played statsitic up to date by adding the time played of the current session to the
 * time that has been played before
 * @param joinTime: time at which the user started playing the game
 */
export function setTimer(joinTime) {
    return {
        'BAQEND': {
            type: SET_TIMER,
            payload: (db) => {
                return db.Character.find().equal('owner', db.User.me.id).singleResult().then((result) => {
                    return db.Statistic.find().equal('character', result).singleResult().then((stats) => {
                        stats.playingTime += Math.abs(new Date() - joinTime);
                        return stats.update();
                    })
                })
            }
        }
    }
}
