import GameObject from './GameObject';


export default function Cow(x, y) {

    GameObject.call(this, x, y);

    this.data = {
        images: ['./assets/cow.png'],
        frames: this.spriteSheet(4, 8, 32),
        animations: {
            walkEast: [8, 11, 'walkEast', 0.3],
            walkNorthEast: [8, 11, 'walkNorthEast', 0.3],
            walkSouthEast: [8, 11, 'walkSouthEast', 0.3],
            walkWest: [4, 7, 'walkWest', 0.3],
            walkNorthWest: [4, 7, 'walkNorthWest', 0.3],
            walkSouthWest: [4, 7, 'walkSouthWest', 0.3],
            walkNorth: [0, 3, 'walkNorth', 0.3],
            walkSouth: [12, 15, 'walkSouth', 0.3],
            idleEast: [28, 31, 'idleEast', 0.1],
            idleNorthEast: [28, 31, 'idleSouthEast', 0.1],
            idleSouthEast: [28, 31, 'idleNorthEast', 0.1],
            idleWest: [20, 23, 'idleWest', 0.1],
            idleNorthWest: [20, 23, 'idleNorthWest', 0.1],
            idleSouthWest: [20, 23, 'idleSouthWest', 0.1],
            idleNorth: [16, 19, 'idleNorth', 0.1],
            idleSouth: [24, 27, 'idleSouth', 0.1]
        }
    };

    this.type = 'Cow';
    this.speed = 3;
    this.direction = 0;
    this.construct();
    this.play('idle');
}