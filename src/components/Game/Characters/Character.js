import GameObject from '../GameObject';
import Fist from '../Projectiles/Fist';
import Shuriken from '../Projectiles/GurandoMasutaa';

export default function Character(x, y) {

    GameObject.call(this, x, y);

    this.idle = () => {
        if (!this.isIdling()) {
            this.play('idle');
        }
    };

    this.punch = () => {
        if (!this.isPunching()) {
            this.play('punch');
            let fist = new Fist(this.x + this.direction.x * 5, this.y + this.direction.y * 5, this.direction);
            fist.owner = this.id;
        }
    };

    this.use = (item) => {
        if(!this.isUsing()) {
            this.play('punch');
            let shuriken = new Shuriken(this.x + this.direction.x * 5, this.y + this.direction.y * 5, this.direction);
            shuriken.owner = this.id;
        }
    };

    this.walk = () => {
        this.play('walk');
    };

    this.isBusy = () => {
        return this.isPunching() || this.isUsing();
    };

    this.isIdling = () => {
        return this.animation === 'idle';
    };

    this.isPunching = () => {
        return this.animation === 'punch';
    };

    // TODO parameter, switch
    this.isUsing = () => {
        return this.animation === 'punch';
    };

    this.isWalking = () => {
        return this.animation === 'walk';
    };

    this.handleCollision = (object, collision) => {
        switch (object.type) {
            case 'Wall':
                let lastX = this.x;
                let lastY = this.y;
                let nextX = lastX;
                let nextY = lastY;

                this.move();
                let nextCollision = this.checkCollision(object);
                let nextSignX = this.direction.x;
                let nextSignY = this.direction.y;

                // kollidiert nicht nur einen Frame lang
                if (nextCollision !== false) {
                    // kollidiert mehr vertikal
                    if (collision.height >= collision.width) {
                        if (this.signX === 0) {
                            // collisionLeft of sprite center
                            if (this.x + 8 > nextCollision.x) {
                                nextSignX = -1;
                            }
                            // collisionRight of sprite center
                            else {
                                nextSignX = 1;
                            }
                        }

                        nextX = lastX - nextSignX * collision.width;
                    }
                    // kollidiert mehr horizontal
                    if (collision.height <= collision.width) {
                        if (this.signY === 0) {
                            // collision below sprite center
                            if (this.y + 8 < nextCollision.y) {
                                nextSignY = 1;
                            }
                            // collision above sprite center
                            else {
                                nextSignY = -1;
                            }
                        }
                        nextY = lastY - nextSignY * collision.height;
                    }
                }
                this.updatePosition(nextX, nextY);
                break;
        }
    };

    this.type = 'Character';
    this.items = [];
    this.vitality = 0;
    this.strength = 0;
    this.dexterity = 0;
    this.intelligence = 0;
    this.maxHP = () => this.baseHP + this.vitality;
    this.speed = 4;
    this.animation = null;
}
