class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, character, username, photo) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0;  // x方向的速度
        this.vy = 0;  // y方向的速度
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;
        this.move_length = 0;  // 移动的直线距离
        this.radius = radius;
        this.color = color;
        this.base_speed = speed;
        this.max_speed = this.base_speed * 1.5;  // 玩家最大速度（血量为0时）
        this.speed = this.base_speed;
        this.character = character;
        this.username = username;
        this.photo = photo;
        this.hp = 100;

        this.eps = 0.01;
        this.friction = 0.9;  // 阻尼
        this.spent_time = 0;
        this.enemy_cold_time = 3;  // 敌人3秒之后开始战斗
        this.fireballs = [];  // 自己发出的所有火球
        this.bullets = [];  // 自己发出的所有子弹
        this.angle = 0;  // 玩家朝向

        this.cur_skill = null;

        if (this.character !== "robot") {
            this.img = new Image();
            this.img.src = this.photo;
        }

        // 只有自己才需要绘制技能图标
        if (this.character === "me") {
            this.skill_icon = new SkillIcon(this);
        }

        this.health_bar = new HealthBar(this.playground, this);
    }

    start() {
        // 在创建玩家的时候更新玩家人数并且重新绘制文字
        this.playground.player_count++;
        this.playground.notice_board.write("已就绪：" + this.playground.player_count + "人");

        if (this.playground.player_count >= 3) {
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting");
        }

        if (this.character === "me") {
            this.add_listening_events();
        } else if (this.character === "robot") {
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
            this.move_to(tx, ty);
        }
    }

    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i++) {
            let x = parseInt(Math.floor(Math.random() * 10)); // 返回[0, 1)
            res += x;
        }
        return res;
    }

    // 监听鼠标事件
    add_listening_events() {
        if (this.playground.operator === "pc") {
            this.add_pc_listening_events();
        } else {
            this.add_phone_listening_events();
        }
    }

    add_phone_listening_events() {
        let outer = this;
        this.fsvjoy = new Fsvjoy(this);

        this.playground.game_map.$canvas.on("touchstart", function (e) {
            // 非战斗状态不能移动
            if (outer.playground.state !== "fighting") {
                return true;
            }
        });

        this.playground.game_map.$canvas.on("touchend", function (e) {
            // 非战斗状态不能移动
            if (outer.playground.state !== "fighting") {
                return true;
            }

            const rect = outer.ctx.canvas.getBoundingClientRect();
            let tx = (e.changedTouches[0].clientX - rect.left) / outer.playground.scale;
            let ty = (e.changedTouches[0].clientY - rect.top) / outer.playground.scale;
            let touch_skill = outer.skill_icon.get_touch_skill(tx, ty);
            let ttx = Math.cos(outer.angle) * 10;
            let tty = Math.sin(outer.angle) * 10;

            // 操作摇杆的手抬起来的时候需要回归摇杆位置
            // 如果是多人模式的话还要广播一个原地不动的命令
            if (tx <= 0.5 && ty >= 0.5) {
                outer.fsvjoy.freshing();
                outer.move_length = 0;
                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_stop_player();
                }
                return false;
            }

            // 如果触摸的位置在技能区的话就判断点击的技能并释放
            if (touch_skill === "fireball" && outer.skill_icon.get_cold_time("fireball") <= outer.eps) {
                let fireball = outer.shoot_fireball(ttx, tty);

                // 如果是多人模式就广播发射火球的行为
                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_shoot_fireball(ttx, tty, fireball.uuid);
                }
            } else if (touch_skill === "normal_attack") {
                let bullet = outer.shoot_bullet(ttx, tty);

                // 如果是多人模式就广播发射子弹的行为
                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_shoot_bullet(ttx, tty, bullet.uuid);
                }
            } else if (touch_skill === "blink" && outer.skill_icon.get_cold_time("blink") <= outer.eps) {
                outer.blink(ttx, tty);

                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_blink(ttx, tty);
                }
            } else if (touch_skill === "shield" && outer.skill_icon.get_cold_time("shield") <= outer.eps) {
                outer.generate_shield();

                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_generate_shield();
                }
            } else if (touch_skill === "track_bullet" && outer.skill_icon.get_cold_time("track_bullet") <= outer.eps) {
                let track_bullet_array = outer.shoot_eight_track_bullet();

                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_shoot_eight_track_bullet(track_bullet_array);
                }
            }
        });

        this.playground.game_map.$canvas.on(`touchmove`, function (e) {
            // 非战斗状态不能移动
            if (outer.playground.state !== "fighting") {
                return true;
            }

            // 获取当前触摸位置
            let rect = outer.ctx.canvas.getBoundingClientRect();
            let clientX = e.targetTouches[0].clientX;
            let clientY = e.targetTouches[0].clientY;

            let tx = (clientX - rect.left) / outer.playground.scale;
            let ty = (clientY - rect.top) / outer.playground.scale;
            if (tx <= 0.5 && ty >= 0.5) {
                // 更新摇杆位置
                outer.fsvjoy.rocker_x = tx;
                outer.fsvjoy.rocker_y = ty;

                // 计算角度并调用移动函数
                outer.angle = Math.atan2(ty - outer.fsvjoy.base_rocker_y, tx - outer.fsvjoy.base_rocker_x);
                let ttx = Math.cos(outer.angle) * 10;
                let tty = Math.sin(outer.angle) * 10;
                outer.move_to(ttx, tty);

                // 如果是多人模式就要同时发送移动信息
                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_move_to(ttx, tty);
                }
            }
        });

    }

    add_pc_listening_events() {
        let outer = this;

        // 关闭右键菜单功能
        this.playground.game_map.$canvas.on("contextmenu", function () {
            return false;
        });

        // 监听鼠标右键点击事件，获取鼠标位置
        this.playground.game_map.$canvas.mousedown(function (e) {
            // 非战斗状态不能移动
            if (outer.playground.state !== "fighting") {
                return true;
            }

            // 项目在acapp的小窗口上运行会有坐标值的不匹配的问题，这里做一下坐标映射
            // 这里canvas前面不能加$，会报错
            const rect = outer.ctx.canvas.getBoundingClientRect();
            if (e.which === 3) {
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                outer.move_to(tx, ty);

                // 如果是多人模式就要同时发送移动信息
                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_move_to(tx, ty);
                }
            } else if (e.which === 1) {
                let tx = (e.clientX - rect.left) / outer.playground.scale;
                let ty = (e.clientY - rect.top) / outer.playground.scale;
                if (outer.cur_skill === "fireball" && outer.skill_icon.get_cold_time("fireball") <= outer.eps) {
                    let fireball = outer.shoot_fireball(tx, ty);

                    // 如果是多人模式就广播发射火球的行为
                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_shoot_fireball(tx, ty, fireball.uuid);
                    }
                } else if (outer.cur_skill === "blink" && outer.skill_icon.get_cold_time("blink") <= outer.eps) {
                    outer.blink(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_blink(tx, ty);
                    }
                } else {
                    let bullet = outer.shoot_bullet(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_shoot_bullet(tx, ty, bullet.uuid);
                    }
                }

                outer.cur_skill = null;
            }
        });

        // 重新绑定监听对象到小窗口
        // 之前的监听对象：$(window).keydown(function (e) {
        this.playground.game_map.$canvas.keydown(function (e) {
            console.log(e.which);

            // 退出，关闭游戏界面回到主界面（ESC键）
            if (e.which === 27) {
                // outer.playground.hide();
                // location.reload();
            }

            // 打开聊天框（Enter键）
            if (e.which === 13 && outer.playground.mode === "multi mode") {
                // 打开聊天框
                outer.playground.chat_field.show_input();
            }

            // 非战斗状态不能攻击
            if (outer.playground.state !== "fighting") {
                return true;
            }

            if (e.which === 81 && outer.skill_icon.get_cold_time("fireball") <= outer.eps) {  // Q键
                outer.cur_skill = "fireball";
                return false;
            } else if (e.which === 70 && outer.skill_icon.get_cold_time("blink") <= outer.eps) {  // F键
                outer.cur_skill = "blink";
                return false;
            } else if (e.which === 87 && outer.skill_icon.get_cold_time("shield") <= outer.eps) {  // W键
                outer.generate_shield();

                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_generate_shield();
                }
                return false;
            } else if (e.which === 69 && outer.skill_icon.get_cold_time("track_bullet") <= outer.eps) {  // E键
                let track_bullet_array = outer.shoot_eight_track_bullet();

                if (outer.playground.mode === "multi mode") {
                    outer.playground.mps.send_shoot_eight_track_bullet(track_bullet_array);
                }
                return false;
            }

            return true;
        });
    }

    generate_shield() {
        this.shield = new Shield(this.playground, this);
        if (this.character === "me") {
            this.skill_icon.set_cold_time("shield");
        }
    }

    shoot_eight_track_bullet() {
        let track_bullet_array = [];
        for (let i = 0; i < 8; i++) {
            let track_bullet = this.shoot_track_bullet(i * Math.PI * 2 / 8);
            track_bullet_array.push(track_bullet);
        }
        if (this.character === "me") {
            this.skill_icon.set_cold_time("track_bullet");
        }
        return track_bullet_array;
    }

    shoot_track_bullet(angle) {
        let x = this.x, y = this.y;
        let vx = Math.cos(angle), vy = Math.sin(angle);

        let track_bullet = new TrackBullet(this.playground, this, x, y, vx, vy);
        // 将新生成的火球放进自己的火球数组里
        this.fireballs.push(track_bullet);

        // 返回刚刚发射的追踪导弹（用于在room里同步所有子弹的uuid）
        return track_bullet;
    }

    shoot_fireball(tx, ty) {
        let x = this.x, y = this.y;
        this.angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(this.angle), vy = Math.sin(this.angle);

        let fireball = new FireBall(this.playground, this, x, y, vx, vy);
        // 将新生成的火球放进自己的火球数组里
        this.fireballs.push(fireball);

        if (this.character === "me") {
            this.skill_icon.set_cold_time("fireball");
        }

        // 返回刚刚发射的火球（用于在room里同步所有子弹的uuid）
        return fireball;
    }

    shoot_bullet(tx, ty) {
        let x = this.x, y = this.y;
        this.angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(this.angle), vy = Math.sin(this.angle);

        let bullet = new Bullet(this.playground, this, x, y, vx, vy);
        // 将新生成的火球放进自己的火球数组里
        this.fireballs.push(bullet);

        // 返回刚刚发射的火球（用于在room里同步所有子弹的uuid）
        return bullet;
    }

    // 通过uuid来删除火球
    destroy_fireball(uuid) {
        for (let i = 0; i < this.fireballs.length; i++) {
            let fireball = this.fireballs[i];
            if (fireball.uuid === uuid) {
                fireball.destroy();
                break;
            }
        }
    }

    // 闪现技能
    blink(tx, ty) {
        let d = this.get_dist(this.x, this.y, tx, ty);
        // 闪现距离最大为高度的0.6倍
        d = Math.min(d, 0.4);
        this.angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(this.angle);
        this.y += d * Math.sin(this.angle);

        // 技能进入冷却
        if (this.character === "me") {
            this.skill_icon.set_cold_time("blink");
        }

        // 闪现之后停下来
        this.move_length = 0;
    }

    // 获取两点之间的直线距离
    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty) {
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        this.angle = Math.atan2(ty - this.y, tx - this.x);  // 移动角度
        this.vx = Math.cos(this.angle);  // 横向速度
        this.vy = Math.sin(this.angle);  // 纵向速度
    }

    is_attacked(angle, damage, hp_damage) {
        // 每次被击中先绘制粒子效果
        for (let i = 0; i < 20 + Math.random() * 8; i++) {
            let x = this.x, y = this.y;
            let radius = this.radius * Math.random() * 0.15;
            let angle = Math.PI * 2 * Math.random();
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color;
            let speed = this.speed * 6;
            let move_length = this.radius * Math.random() * 7;
            new Particle(this.playground, x, y, radius, vx, vy, color, speed, move_length);
        }

        this.hp -= hp_damage;
        if (this.hp < this.eps) {
            this.destroy();
            return false;
        }

        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = hp_damage / 25;  // 按照y总的击退距离等比例应用在满血100的玩家上
        this.speed = this.base_speed + (this.max_speed - this.base_speed) / 100 * (100 - this.hp);
    }

    // 多人模式下玩家接收到被攻击的信息
    receive_attack(x, y, angle, damage, hp_damage, ball_uuid, attacker) {
        attacker.destroy_fireball(ball_uuid);
        this.x = x;
        this.y = y;
        this.is_attacked(angle, damage, hp_damage);
    }

    update() {
        this.update_move();
        this.update_win();

        this.render();
    }

    late_update() {

    }

    update_win() {
        if (this.playground.state === "fighting" && this.character === "me" && this.playground.players.length === 1) {
            // 先让玩家停下来
            if (this.playground.operator === "phone") {
                this.fsvjoy.freshing();
            }
            this.move_length = 0;
            if (this.playground.mode === "multi mode") {
                this.playground.mps.send_stop_player();
            }

            this.playground.state = "over";
            this.playground.score_board.win();
        }
    }

    // 更新玩家移动
    update_move() {
        this.spent_time += this.timedelta / 1000;
        // 自动攻击：不是玩家 & 冷静一段时间 & 玩家个数大于1 & 一定概率
        if (this.character === "robot" && this.spent_time > this.enemy_cold_time && this.playground.players.length > 1 && Math.random() < 1 / 180.0) {
            // 初始化将要选择的玩家
            let player = this.playground.players[0];
            // 如果随机到的攻击对象是自己的话就重新选择
            while (true) {
                player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
                if (player !== this) {
                    break;
                }
            }
            this.shoot_fireball(player.x, player.y);
        }

        // 击退的过程中强制移动
        if (this.damage_speed > this.eps) {
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.friction;
        } else {
            if (this.move_length < this.eps) {
                this.move_length = 0;
                this.vx = this.vy = 0;
                if (this.character === "robot") {
                    let tx = Math.random() * this.playground.width / this.playground.scale;
                    let ty = Math.random() * this.playground.height / this.playground.scale;
                    this.move_to(tx, ty);
                }
            } else {
                // 计算出的移动距离 和 按照当前速度一帧移动的距离 取最小值（不能移出界）
                let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
                this.x += this.vx * moved;
                this.y += this.vy * moved;
                this.move_length -= moved;
            }
        }
    }

    render() {
        let scale = this.playground.scale;

        // 如果是自己就画出头像，如果是敌人就用颜色代替
        if (this.character !== "robot") {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }
    }

    // 玩家死亡后将其从this.playground.players里面删除
    // 这个函数和基类的destroy不同，基类的是将其从AC_GAME_OBJECTS数组里面删除
    on_destroy() {
        if (this.character === "me" && this.skill_icon) {
            this.skill_icon.destroy();
            this.skill_icon = null;
        }

        if (this.character === "me" && this.playground.state === "fighting") {
            this.playground.state = "over";
            this.playground.score_board.lose();
        }

        if (this.health_bar) {
            this.health_bar.destroy();
            this.health_bar = null;
        }

        if (this.shield) {
            this.shield.destroy();
            this.shield = null;
        }

        for (let i = 0; i < this.playground.players.length; i++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
                break;
            }
        }
    }
}

