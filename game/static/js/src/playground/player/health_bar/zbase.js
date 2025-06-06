class HealthBar extends AcGameObject {
    constructor(playground, player) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.half_line = this.player.radius * 1.2;
        this.botton_on_player = this.player.radius * 1.35;
        this.x = this.player.x;
        this.y = this.player.y;
        this.background_color = "grey";
        this.color = null;

        this.eps = 0.01;
    }

    start() {
        if (this.player.character === "robot") {
            this.color = "red";
        } else if (this.player.character === "me") {
            this.color = "lightgreen";
        } else {
            this.color = "yellow";
        }
    }

    update() {
        this.x = this.player.x;
        this.y = this.player.y;

        this.render();
    }

    render() {
        let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.moveTo((this.x - this.half_line * 1.1) * scale, (this.y - this.botton_on_player) * scale);
        this.ctx.lineTo((this.x + this.half_line * 1.1) * scale, (this.y - this.botton_on_player) * scale);
        this.ctx.lineWidth = 9;
        this.ctx.strokeStyle = this.background_color;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo((this.x - this.half_line) * scale, (this.y - this.botton_on_player) * scale);
        this.ctx.lineTo((this.x + (this.half_line * 2 * this.player.hp / 100 - this.half_line)) * scale, (this.y - this.botton_on_player) * scale);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();

        this.ctx.lineWidth = 1;
    }
}