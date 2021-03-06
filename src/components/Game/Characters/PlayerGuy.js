import Character from './Character';
import GameStage from '../GameStage';

import {KEYCODE_UP, KEYCODE_DOWN, KEYCODE_LEFT, KEYCODE_RIGHT, KEYCODE_S, KEYCODE_1, KEYCODE_K} from '../Constants/KeyCodes';
import {
    DIRECTION_SOUTH, DIRECTION_NORTH, DIRECTION_EAST, DIRECTION_WEST,
    DIRECTION_NORTHEAST, DIRECTION_NORTHWEST, DIRECTION_SOUTHEAST, DIRECTION_SOUTHWEST
} from '../Constants/Directions';

export default function PlayerGuy(x, y) {

    Character.call(this, x, y);

    /**
     * Moves and checks the collision every tick, when walking
     */
    this.update = () => {
        if (!this.isBusy() && this.isWalking()) {
            this.move();
            this.check();
        }
    };

    /**
     * writes the current position and state to baqend
     */
    this.updateBaqend = () => {
        this.character.x = this.x;
        this.character.y = this.y;
        this.character.direction = this.direction;
        this.character.animation = this.animation;
        this.character.current_hp = this.currentHP;

        // use the isReady hack to suppress the write lock error
        if (this.character._metadata.isReady) {
            this.character.update({force: true});
        }
    };

    /**
     * Creates a item in baqend and equip it after
     * @param item
     */
    this.createBaqendItem = (item) => {
        let backupItem = item;
        item = new GameStage().db.Item({
            type: item.type,
            name: item.name,
            vitality: item.vitality,
            strength: item.strength,
            dexterity: item.dexterity,
            intelligence: item.intelligence,
            movement_speed: item.movementSpeed
        });
        item.insert().then(baqendItem => {
            backupItem.id = baqendItem.id;
            this.equipBaqend(baqendItem);
        });
    };

    /**
     * equips a item or puts it in to inventory
     * @param item
     */
    this.equipBaqend = (item) => {
        GameStage().db.Equipment.find().equal('body', this.character).singleResult().then(equipment => {
            if (equipment[item.type] !== undefined) {
                // equip it
                equipment[item.type] = item;
                equipment.update();
            } else {
                // put it in inventory
                let inventoryItem = new GameStage().db.InventoryItem({ owner: this.character, item: item, active: true});
                inventoryItem.insert();
            }
        });
    };

    /**
     * remove an item from your inventory
     * @param item
     */
    this.removeFromInventoryBaqend = (item) => {
        GameStage().db.InventoryItem.find().equal('item', item.id).singleResult().then(item => {
            item.active = false;
            item.update();
        });
    };

    /**
     * takes damage, emits to all and updates baqend
     * @param object
     */
    this.takeDamage = (object) => {
        // make sure that you can't have hp < 0
        this.currentHP = Math.max(0, this.currentHP - Math.max(0, object.damage - this.armor));
        this.hpBar.updateHealth();
        if (this.isDead()) {
            this.destruct();
            GameStage().activeObject = GameStage().getNetworkObject(1);
            GameStage().startCountdown(5);
            this.respawn(5000);
        }
        this.updateBaqend();
        this.emit('change');
    };

    /**
     * respawns and tell other that you are back
     * @param timeout
     */
    this.respawn = (timeout) => {
        setTimeout(() => {
            this.heal(this.maxHP());
            this.updatePosition(this.spawnX, this.spawnY);
            GameStage().add(this);
            this.hpBar.updateHealth();
            this.hpBar.displayHealth();
            GameStage().activeObject = this;
            this.emit('change');
        }, timeout);
    };


    /**
     * Handle key down and key up event.
     * TODO: refactor this! use math
     */
    this.handleEvent = () => {
        let lastKey = GameStage().activeKeys[GameStage().activeKeys.length - 1];
        let secondToLastKey = GameStage().activeKeys[GameStage().activeKeys.length - 2];
        let direction = this.direction;
        switch (lastKey) {
            case KEYCODE_LEFT:
                // move left
                if (secondToLastKey === KEYCODE_UP) this.direction = DIRECTION_NORTHWEST;
                else if (secondToLastKey === KEYCODE_DOWN) this.direction = DIRECTION_SOUTHWEST;
                else this.direction = DIRECTION_WEST;

                if (this.directionChanged(direction) || !this.isWalking()) {
                    this.walk();
                    this.emit('change');
                }
                break;
            case KEYCODE_RIGHT:
                // move right
                if (secondToLastKey === KEYCODE_UP) this.direction = DIRECTION_NORTHEAST;
                else if (secondToLastKey === KEYCODE_DOWN) this.direction = DIRECTION_SOUTHEAST;
                else this.direction = DIRECTION_EAST;

                if (this.directionChanged(direction) || !this.isWalking()) {
                    this.walk();
                    this.emit('change');
                }
                break;
            case KEYCODE_UP:
                // move up
                if (secondToLastKey === KEYCODE_LEFT) this.direction = DIRECTION_NORTHWEST;
                else if (secondToLastKey === KEYCODE_RIGHT) this.direction = DIRECTION_NORTHEAST;
                else this.direction = DIRECTION_NORTH;

                if (this.directionChanged(direction) || !this.isWalking()) {
                    this.walk();
                    this.emit('change');
                }
                break;
            case KEYCODE_DOWN:
                // move down
                if (secondToLastKey === KEYCODE_LEFT) this.direction = DIRECTION_SOUTHWEST;
                else if (secondToLastKey === KEYCODE_RIGHT) this.direction = DIRECTION_SOUTHEAST;
                else this.direction = DIRECTION_SOUTH;

                if (this.directionChanged(direction) || !this.isWalking()) {
                    this.walk();
                    this.emit('change');
                }
                break;
            case KEYCODE_S:
                // punch
                this.punch();
                this.emit('punch');
                break;
            case KEYCODE_K:
                // suicide
                this.takeDamage({damage: 5000});
                break;
            case KEYCODE_1:
                // use weapon
                // TODO type
                if (this.weapon !== null) {
                   this.use();
                   this.emit('use');
                }
                this.emit('change');
                break;
            default:
                // idle and update baqend
                this.idle();
                this.emit('change');
                this.updateBaqend();
        }
    };

    this.height = 16;
    this.width = 16;

    this.data = {
        images: ['./assets/guyGreen.png'],
        frames: this.spriteSheet(4, 32),
        animations: {
            walkEast: [8 * 4, 8 * 4 + 2, 'walkEast', 0.3],
            walkWest: [9 * 4, 9 * 4 + 2, 'walkWest', 0.3],
            walkNorth: [10 * 4, 10 * 4 + 3, 'walkNorth', 0.3],
            walkSouth: [11 * 4, 11 * 4 + 3, 'walkSouth', 0.3],
            walkNorthEast: [12 * 4, 12 * 4 + 3, 'walkNorthEast', 0.3],
            walkNorthWest: [13 * 4, 13 * 4 + 3, 'walkNorthWest', 0.3],
            walkSouthEast: [14 * 4, 14 * 4 + 2, 'walkSouthEast', 0.3],
            walkSouthWest: [15 * 4, 15 * 4 + 2, 'walkSouthWest', 0.3],
            idleEast: [0, 3, 'idleEast', 0.3],
            idleWest: [4, 4 + 3, 'idleWest', 0.3],
            idleNorth: [2 * 4, 2 * 4 + 3, 'idleNorth', 0.25],
            idleSouth: [3 * 4, 3 * 4 + 3, 'idleSouth', 0.25],
            idleNorthEast: [4 * 4, 4 * 4 + 3, 'idleNorthEast', 0.25],
            idleNorthWest: [5 * 4, 5 * 4 + 3, 'idleNorthWest', 0.25],
            idleSouthEast: [7 * 4, 7 * 4 + 3, 'idleSouthEast', 0.25],
            idleSouthWest: [6 * 4, 6 * 4 + 3, 'idleSouthWest', 0.25],
            punchEast: [16 * 4, 16 * 4 + 2, 'idleEast', 0.5],
            punchWest: [17 * 4, 17 * 4 + 2, 'idleWest', 0.5],
            punchNorth: [18 * 4, 18 * 4 + 2, 'idleNorth', 0.5],
            punchSouth: [19 * 4, 19 * 4 + 2, 'idleSouth', 0.5],
            punchNorthEast: [20 * 4, 20 * 4 + 2, 'idleNorthEast', 0.5],
            punchNorthWest: [21 * 4, 21 * 4 + 2, 'idleNorthWest', 0.5],
            punchSouthEast: [23 * 4, 23 * 4 + 2, 'idleSouthEast', 0.5],
            punchSouthWest: [22 * 4, 22 * 4 + 2, 'idleSouthWest', 0.5],
            runningKick: [0, 3, 'idle', 0.25]
        }
    };

    this.type = 'Player';
    this.character = null;

    this.construct();
    this.idle();
    // display healthbar on create
    this.hpBar.displayHealth();
}
