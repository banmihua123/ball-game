class Shield extends AcGameObject {
    constructor(playground, player) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.radius = this.player.radius * 2;
        this.x = this.player.x;
        this.y = this.player.y;
        this.color = "rgb(158,55,155)";
        this.base_duration_time = 3;
        this.duration_time = this.base_duration_time;

        this.eps = 0.01;
    }

    start() {

    }

    update() {
        if (this.duration_time <= this.eps) {
            this.destroy();
            return false;
        }

        this.x = this.player.x;
        this.y = this.player.y;

        // 渲染护盾图形
        this.render();

        // 检测撞上护盾的子弹将其删除
        this.update_destroy_ball();

        // 更新护盾持续时间
        this.update_duration_time();
    }

    update_duration_time() {
        this.duration_time -= this.timedelta / 1000;
        this.duration_time = Math.max(0, this.duration_time);
    }

    render() {
        let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }

    update_destroy_ball() {
        for (let i = 0; i < this.playground.players.length; i++) {
            let player = this.playground.players[i];
            if (player !== this.player) {
                for (let j = 0; j < player.fireballs.length; j++) {
                    let fireball = player.fireballs[j];
                    if (this.is_collision(fireball)) {
                        fireball.destroy();
                    }
                }
            }
        }
    }

    is_collision(ball) {
        if (this.get_dist(this.x, this.y, ball.x, ball.y) <= this.radius + ball.radius) {
            return true;
        }
        return false;
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
}