class SkillIcon extends AcGameObject {
    constructor(player) {
        super();
        this.player = player;
        this.playground = this.player.playground;
        this.ctx = this.playground.game_map.ctx;
        this.operator = this.playground.operator;

    }

    start() {
        // 火球技能冷却时间（单位：秒）
        this.fireball_img = new Image();
        this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";

        // 闪现技能冷却时间
        this.blink_img = new Image();
        this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";

        // 护盾技能图标
        this.shield_img = new Image();
        this.shield_img.src = "https://tank-war-static.oss-cn-hangzhou.aliyuncs.com/BattleOfBalls/skill/shield.jfif";

        // 追踪导弹技能图标
        this.track_bullet = new Image();
        this.track_bullet.src = "https://tank-war-static.oss-cn-hangzhou.aliyuncs.com/BattleOfBalls/skill/track_bullet.png";

        this.normal_attack = new Image();
        this.normal_attack.src = "https://tank-war-static.oss-cn-hangzhou.aliyuncs.com/BattleOfBalls/normalattack.png";

        this.skill_param = {
            "normal_attack": {
                phone_position: { x: 1.6, y: 0.8, r: 0.11 },
                cold_time: 0.1, base_cold_time: 0.1, img: this.normal_attack
            },
            "fireball": {
                pc_position: { x: 1.62, y: 0.9, r: 0.04 },
                phone_position: { x: 1.4, y: 0.75, r: 0.055 },
                cold_time: 1, base_cold_time: 1, img: this.fireball_img, key: "Q"
            },
            "blink": {
                pc_position: { x: 1.5, y: 0.9, r: 0.04 },
                phone_position: { x: 1.31, y: 0.9, r: 0.055 },
                cold_time: 3, base_cold_time: 3, img: this.blink_img, key: "F"
            },
            "shield": {
                pc_position: { x: 1.38, y: 0.9, r: 0.04 },
                phone_position: { x: 1.5, y: 0.62, r: 0.055 },
                cold_time: 5, base_cold_time: 5, img: this.shield_img, key: "W"
            },
            "track_bullet": {
                pc_position: { x: 1.26, y: 0.9, r: 0.04 },
                phone_position: { x: 1.6, y: 0.49, r: 0.055 },
                cold_time: 7, base_cold_time: 7, img: this.track_bullet, key: "E"
            },
        };
    }

    add_listening_events() {

    }

    get_touch_skill(tx, ty) {
        for (let skill_name in this.skill_param) {
            let position = this.skill_param[skill_name].phone_position;
            if (this.player.get_dist(tx, ty, position.x, position.y) <= position.r) {
                return skill_name;
            }
        }
    }

    get_cold_time(skill_name) {
        return this.skill_param[skill_name].cold_time;
    }

    // 让技能进入CD
    set_cold_time(skill_name) {
        this.skill_param[skill_name].cold_time = this.skill_param[skill_name].base_cold_time;
    }

    late_update() {
        this.update_skill_coldtime();
        this.render_skill_coldtime();
        this.render_text();
    }

    // 渲染技能对应的按键
    render_text() {
        if (this.operator === "phone") {
            return false;
        }

        let scale = this.playground.scale;
        for (let skill_name in this.skill_param) {
            let position = this.skill_param[skill_name].pc_position;
            let key = this.skill_param[skill_name].key;
            if (this.operator === "pc" && skill_name === "normal_attack") {
                continue;
            }
            // canvas 渲染文本
            this.ctx.font = "20px serif";
            this.ctx.fillStyle = "white";
            this.ctx.textAlign = "center";
            this.ctx.fillText(key, position.x * scale, (position.y + position.r * 1.7) * scale);
        }
    }

    // 更新技能冷却时间
    update_skill_coldtime() {
        for (let skill_name in this.skill_param) {
            let param = this.skill_param[skill_name];
            if (this.operator === "pc" && skill_name === "normal_attack") {
                continue;
            }
            param.cold_time -= this.timedelta / 1000;
            param.cold_time = Math.max(param.cold_time, 0);
        }
    }

    // 渲染技能图标和冷却时间蒙版
    render_skill_coldtime() {
        for (let skill_name in this.skill_param) {
            let param = this.skill_param[skill_name];
            if (this.operator === "pc" && skill_name === "normal_attack") {
                continue;
            }
            this.render_coldtime(skill_name, param.img, param.cold_time, param.base_cold_time)
        }
    }

    render_coldtime(skill_name, skill_img, skill_cold_time, base_skill_cold_time) {
        let x = null, y = null, r = null;
        if (this.operator === "phone") {
            x = this.skill_param[skill_name].phone_position.x
            y = this.skill_param[skill_name].phone_position.y
            r = this.skill_param[skill_name].phone_position.r;
        } else {
            x = this.skill_param[skill_name].pc_position.x
            y = this.skill_param[skill_name].pc_position.y
            r = this.skill_param[skill_name].pc_position.r;
        }
        let scale = this.playground.scale;

        // 渲染图片
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.clip();
        this.ctx.drawImage(skill_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        // 渲染护盾剩余冷却和时间蒙版
        if (skill_cold_time > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - skill_cold_time / base_skill_cold_time) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.4)";
            this.ctx.fill();
        }
    }
}

