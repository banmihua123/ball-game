class TrackBullet extends FireBall {
    constructor(playground, player, x, y, vx, vy) {
        super(playground, player, x, y, vx, vy);
        this.color = "red";
        this.damage = 0.01;
        this.hp_damage = 8;
        this.max_speed = 0.7;
        this.slow_down_time = 0.4;  // 追踪球减速时间
        this.accelerate_time = 1;  // 追踪球加速时间
        this.temp_time = this.slow_down_time;
        this.is_accelerate = false;  // 是否在加速
        this.move_length = 1.1;

    }

    start() {

    }

    late_update() {
        this.update_speed();
    }

    // 更新追踪导弹位置
    update_move() {
        if (!this.is_accelerate || this.playground.players.length <= 1) {
            let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
            this.x += this.vx * moved;
            this.y += this.vy * moved;
            this.move_length -= moved;
        } else {
            // 选择一个最近的敌人
            let recent_player = null;
            for (let i = 0; i < this.playground.players.length; i++) {
                let player = this.playground.players[i];
                let distance = this.get_dist(player.x, player.y, this.x, this.y);
                if (player === this.player) {
                    continue;
                }

                if (!recent_player || this.get_dist(recent_player.x, recent_player.y, this.x, this.y) > distance) {
                    recent_player = player;
                }
            }

            // 计算移动角度
            this.angle = Math.atan2(recent_player.y - this.y, recent_player.x - this.x);
            this.vx = Math.cos(this.angle), this.vy = Math.sin(this.angle);

            // 开始追踪
            let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
            this.x += this.vx * moved;
            this.y += this.vy * moved;
            this.move_length -= moved;
        }
    }

    update_speed() {
        if (!this.is_accelerate) {
            this.temp_time -= this.timedelta / 1000;
            this.speed = this.max_speed * (this.temp_time / this.slow_down_time);

            // 减速时间结束后就开始加速
            if (this.temp_time <= this.eps) {
                this.is_accelerate = true;
                this.temp_time = 0;
            }
        } else {
            this.temp_time += this.timedelta / 1000;
            this.temp_time = Math.min(this.temp_time, this.accelerate_time);
            this.speed = this.max_speed * (this.temp_time / this.accelerate_time);
        }
    }
}