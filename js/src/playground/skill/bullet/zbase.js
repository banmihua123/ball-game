class Bullet extends AcGameObject {
    constructor(playground, player, x, y, vx, vy) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.x = x;
        this.y = y;
        this.radius = 0.005;
        this.vx = vx;
        this.vy = vy;
        this.color = "white";
        this.speed = 0.7;
        this.move_length = 0.5;
        this.damage = 0.001;
        this.hp_damage = 2.5;

        this.eps = 0.01;
    }

    start() {

    }

    update() {
        if (this.move_length < this.eps) {
            this.destroy();
            return false;
        }

        this.update_move();

        // 只有当发射火球的玩家是自己才判断碰撞（当前窗口具有当前玩家发射炮弹的决策权）
        if (this.player.character !== "enemy") {
            this.update_attack();
        }

        this.render();
    }

    // 更新火球位置
    update_move() {
        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.move_length -= moved;
    }

    // 子弹攻击逻辑
    update_attack() {
        for (let i = 0; i < this.playground.players.length; i++) {
            let player = this.playground.players[i];
            if (this.player != player && this.is_collision(player)) {
                this.attack(player);
                break;
            }
        }
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    is_collision(player) {
        let distance = this.get_dist(this.x, this.y, player.x, player.y);
        if (distance < this.radius + player.radius) {
            return true;
        }
        return false;
    }

    attack(player) {
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(angle, this.damage, this.hp_damage);

        // 只有多人模式下才需要广播子弹攻击
        if (this.playground.mode === "multi mode") {
            this.playground.mps.send_attack(player.uuid, player.x, player.y, angle, this.damage, this.hp_damage, this.uuid);
        }

        this.destroy();
    }

    render() {
        let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    // 删除子弹之前会执行一次这个函数
    on_destroy() {
        // 删除子弹对象之前先把它从player的子弹数组里面删除
        let fireballs = this.player.fireballs;
        for (let i = 0; i < fireballs.length; i++) {
            if (fireballs[i] === this) {
                fireballs.splice(i, 1);
                break;
            }
        }
    }
}

