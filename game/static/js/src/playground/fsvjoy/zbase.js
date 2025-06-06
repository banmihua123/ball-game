// 摇杆
class Fsvjoy extends AcGameObject {
    constructor(player) {
        super();
        this.player = player;
        this.playground = this.player.playground;
        this.ctx = this.playground.game_map.ctx;
        this.rockerbg_x = 0.20;
        this.rockerbg_y = 0.78;
        this.base_rocker_x = this.rockerbg_x;
        this.base_rocker_y = this.rockerbg_y;
        this.rocker_x = this.base_rocker_x;
        this.rocker_y = this.base_rocker_y;

        this.rockerbg_r = 0.12;
        this.rocker_r = 0.04;
    }

    setobj(role) {
        this.obj = role;
    }

    getSpeed() {
        return this.speed;
    }

    start() {

    }

    freshing() {
        this.rocker_x = this.base_rocker_x;
        this.rocker_y = this.base_rocker_y;
    }

    late_update() {
        this.render();
    }

    render() {
        this.draw_rockerbg();
        this.draw_rocker();
    }

    draw_rockerbg() {
        let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.arc(this.rockerbg_x * scale, this.rockerbg_y * scale, this.rockerbg_r * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = "rgba(192, 192, 192, 0.2)";
        this.ctx.fill();
    }

    draw_rocker() {
        let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.arc(this.rocker_x * scale, this.rocker_y * scale, this.rocker_r * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = "white";
        this.ctx.fill();
    }
}

