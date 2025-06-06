class BloodBar extends AcGameObject {
    constructor(playground, player) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.radius = this.player.radius * 1.1;
        this.x = this.player.x;
        this.y = this.player.y;
        this.color = "lightgreen";

        this.eps = 0.01;
    }

    start() {

    }

    update() {
        this.x = this.player.x;
        this.y = this.player.y;

        this.render();
    }

    render() {
        let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.lineWidth = 5;
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }
}