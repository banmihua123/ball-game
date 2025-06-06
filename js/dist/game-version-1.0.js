class FullScreen {
    /**
     * @description: 全屏初始化
     * @param {Function} fn 用户浏览器不支持全屏的回调
     */
    constructor(fn) {
        this.prefixName = ""; // 浏览器前缀
        this.isFullscreenData = true; // 浏览器是否支持全屏
        this.isFullscreen(fn);
    }
    /**
     * @description: 将传进来的元素全屏
     * @param {String} domName 要全屏的dom名称
     */
    Fullscreen(domName) {
        const element = document.querySelector(domName);
        const methodName =
            this.prefixName === ""
                ? "requestFullscreen"
                : `${this.prefixName}RequestFullScreen`;
        element[methodName]();
    }
    // 退出全屏
    exitFullscreen() {
        const methodName =
            this.prefixName === ""
                ? "exitFullscreen"
                : `${this.prefixName}ExitFullscreen`;
        document[methodName]();
    }
    /**
     * @description: 监听进入/离开全屏
     * @param {Function} enter 进入全屏的回调
     *  @param {Function} quit 离开全屏的回调
     */
    screenChange(enter, quit) {
        if (!this.isFullscreenData) return;
        const methodName = `on${this.prefixName}fullscreenchange`;
        document[methodName] = e => {
            if (this.isElementFullScreen()) {
                enter && enter(e); // 进入全屏回调
            } else {
                quit && quit(e); // 离开全屏的回调
            }
        };
    }
    /**
     * @description: 浏览器无法进入全屏时触发,可能是技术原因，也可能是用户拒绝：比如全屏请求不是在事件处理函数中调用,会在这里拦截到错误
     * @param {Function} enterErrorFn 回调
     */
    screenError(enterErrorFn) {
        const methodName = `on${this.prefixName}fullscreenerror`;
        document[methodName] = e => {
            enterErrorFn && enterErrorFn(e);
        };
    }
    /**
     * @description: 是否支持全屏+判断浏览器前缀
     * @param {Function} fn 不支持全屏的回调函数 这里设了一个默认值
     */
    isFullscreen(fn) {
        let fullscreenEnabled;
        // 判断浏览器前缀
        if (document.fullscreenEnabled) {
            fullscreenEnabled = document.fullscreenEnabled;
        } else if (document.webkitFullscreenEnabled) {
            fullscreenEnabled = document.webkitFullscreenEnabled;
            this.prefixName = "webkit";
        } else if (document.mozFullScreenEnabled) {
            fullscreenEnabled = document.mozFullScreenEnabled;
            this.prefixName = "moz";
        } else if (document.msFullscreenEnabled) {
            fullscreenEnabled = document.msFullscreenEnabled;
            this.prefixName = "ms";
        }
        if (!fullscreenEnabled) {
            this.isFullscreenData = false;
            fn && fn(); // 执行不支持全屏的回调
        }
    }
    /**
     * @description: 检测有没有元素处于全屏状态
     * @return 布尔值
     */
    isElementFullScreen() {
        const fullscreenElement =
            document.fullscreenElement ||
            document.msFullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement;
        if (fullscreenElement === null) {
            return false; // 当前没有元素在全屏状态
        } else {
            return true; // 有元素在全屏状态
        }
    }
}class AcGameMenu {
    // root就是web.html里的ac_game对象
    constructor(root) {
        this.root = root;
        this.platform = this.root.settings.platform;
        // 前面加$表示js对象
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            单人模式
        </div>
        </br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人模式
        </div>
        </br>
        <div class="ac-game-menu-field-item ac-game-playground-item-fullscreen-mode">
            全屏
        </div>
        <div class="ac-game-menu-field-fullscreen-br">
            </br>
        </div>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
            退出
        </div>
    </div>
</div>
`);
        this.$menu.hide();
        // 将menu对象添加到ac_game对象中，这样就能动态更改页面了
        this.root.$ac_game.append(this.$menu);

        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');

        this.$fullscreen_mode = this.$menu.find('.ac-game-playground-item-fullscreen-mode');
        this.$fullscreen_br = this.$menu.find('.ac-game-menu-field-fullscreen-br');

        this.start();
    }

    start() {
        this.add_listening_events();
        if (this.platform === "ACAPP") {
            this.$fullscreen_mode.hide();
            this.$fullscreen_br.hide();
        }
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function () {
            if (outer.root.playground.operator === "phone" && outer.platform !== "ACAPP") {
                outer.fullscreen();
            }
            outer.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.click(function () {
            if (outer.root.playground.operator === "phone" && outer.platform !== "ACAPP") {
                outer.fullscreen();
            }
            outer.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.click(function () {
            outer.root.settings.logout_on_remote();
        });
        this.$fullscreen_mode.click(function () {
            outer.fullscreen();
        });
    }

    show() {  // 显示menu界面
        // 使用的是jQuery的API
        this.$menu.show();
    }

    hide() {  // 关闭menu界面
        this.$menu.hide();
    }

    fullscreen() {
        let fullscreen = new FullScreen(() => {
            console.log("不支持");
        });
        fullscreen.Fullscreen("#ac_game_123");
    }
}let AC_GAME_OBJECTS = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);

        this.has_called_start = false;  // 是否执行过start函数
        this.timedelta = 0;  // 当前距离上一帧的时间间隔（单位：ms）
        this.uuid = this.create_uuid();
        // console.log(this.uuid);
    }

    // 创建一个唯一编号，用于联机对战识别窗口和用户
    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i++) {
            let x = parseInt(Math.floor(Math.random() * 10)); // 返回[0, 1)
            res += x;
        }
        return res;
    }

    start() {  // 只会在第一帧执行

    }

    update() {  // 每一帧都会执行一次

    }

    late_update() {  // 在每一帧的最后执行一次

    }

    on_destroy() {  // 在被销毁前执行一次

    }

    destroy() {  // 销毁该物体
        this.on_destroy();

        for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
            if (AC_GAME_OBJECTS[i] === this) {
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }

        // console.log(AC_GAME_OBJECTS);
    }
}

let last_timestamp;
let AC_GAME_ANIMATION = function (timestamp) {

    for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
        let obj = AC_GAME_OBJECTS[i];
        if (!obj.has_called_start) {
            obj.start();
            obj.has_called_start = true;
        } else {
            obj.timedelta = timestamp - last_timestamp;
            obj.update();  // 如果是子类就会先找子类的update()函数执行，如果没有的话就执行基类的，所以只要继承了这个基类就会每秒自动执行60次update()
        }
    }

    // 在前面都绘制完成了之后调用late_update，这样就能实现将某些对象显示在最上面了
    for (let i = 1; i < AC_GAME_OBJECTS.length; i++) {
        let obj = AC_GAME_OBJECTS[i];
        obj.late_update();
    }

    last_timestamp = timestamp;

    // 递归调用，这样就会每一帧调用一次了
    requestAnimationFrame(AC_GAME_ANIMATION);
}

// 会将函数的执行时间控制在1/60秒（这一整行是一帧）
requestAnimationFrame(AC_GAME_ANIMATION);

class ChatField {
    constructor(playground) {
        this.playground = playground;

        this.$history = $(`<div class="ac-game-chat-field-history">history</div>`);
        this.$input = $(`<input type="text" class="ac-game-chat-field-input">`);

        this.$history.hide();
        this.$input.hide();
        this.func_id = null;

        this.playground.$playground.append(this.$history);
        this.playground.$playground.append(this.$input);

        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;

        this.$input.keydown(function (e) {
            if (e.which === 27) {  // ESC键
                outer.hide_input();
                return false;
            } else if (e.which === 13) {  // Enter键
                let username = outer.playground.root.settings.username;
                let text = outer.$input.val();
                if (text) {
                    outer.$input.val("");
                    outer.add_message(username, text);

                    // 多人模式广播发送消息事件
                    outer.playground.mps.send_message(username, text);
                }
                return false;
            }
        });
    }

    // 渲染消息
    render_message(message) {
        return $(`<div>${message}</div>`)
    }

    // 向历史记录里添加信息
    add_message(username, text) {
        this.show_history();

        let message = `[${username}] ${text}`;
        this.$history.append(this.render_message(message));
        // 每次添加信息后都将滚动条拖到最下面
        this.$history.scrollTop(this.$history[0].scrollHeight);
    }

    show_history() {
        let outer = this;
        // JQuery的API，用于将$input慢慢显示出来
        this.$history.fadeIn();

        // 因为下面的监听函数会在3秒后强制执行，所以可能第二次打开输入框会马上关闭历史记录
        // 这里记录一下监听函数的id，然后每次清空一下就行
        if (this.func_id) clearTimeout(this.func_id);

        this.func_id = setTimeout(function () {
            outer.$history.fadeOut();
            // 3秒后记得删除函数id
            outer.func_id = null;
        }, 3000);

    }

    show_input() {
        this.show_history();

        this.$input.show();
        this.$input.focus();
    }

    hide_input() {
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
    }
}// 摇杆
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

class GameMap extends AcGameObject {
    constructor(playground) {
        super();  // 调用基类的构造函数
        this.playground = playground;
        // tabindex=0：给canvas绑上监听事件
        this.$canvas = $(`<canvas tabindex=0></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start() {
        // 聚焦到当前canvas
        this.$canvas.focus();

        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;

        // 关闭右键菜单功能
        this.playground.game_map.$canvas.on("contextmenu", function () {
            return false;
        });
    }

    // 动态修改GameMap的长宽
    resize() {
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        // 每次resize结束都涂一层纯黑的背景
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    update() {
        this.render();
    }

    // 渲染游戏地图
    render() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}class NoticeBoard extends AcGameObject {
    constructor(playground) {
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.text = "已就绪：0人";

        this.start();
    }

    start() {

    }

    write(text) {
        this.text = text;
    }

    update() {
        this.render();
    }

    render() {
        // canvas 渲染文本
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width / 2, 20);
    }
}
class Particle extends AcGameObject {
    constructor(playground, x, y, radius, vx, vy, color, speed, move_length) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;

        this.friction = 0.9;
        this.eps = 0.1;
    }

    start() {

    }

    update() {
        if (this.move_length < this.eps || this.speed < this.eps) {
            this.destroy();
            return false;
        }

        this.moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * this.moved;
        this.y += this.vy * this.moved;
        this.speed *= this.friction;
        this.move_length -= this.moved;

        this.render();
    }

    render() {
        let scale = this.playground.scale;

        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}class HealthBar extends AcGameObject {
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
}class Player extends AcGameObject {
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
            this.skill_icon = new SkillIcon(this);
            this.img = new Image();
            this.img.src = this.photo;
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
        // this.add_phone_listening_events();
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
            } else if (touch_skill === "track_bullet" && outer.skill_icon.get_cold_time("track_bullet") <= outer.eps) {
                let track_bullet_array = outer.shoot_eight_track_bullet();
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
                return false;
            } else if (e.which === 69 && outer.skill_icon.get_cold_time("track_bullet") <= outer.eps) {  // E键
                let track_bullet_array = outer.shoot_eight_track_bullet();
                return false;
            }

            return true;
        });
    }

    generate_shield() {
        this.shield = new Shield(this.playground, this);
        if (this.character !== "robot") {
            this.skill_icon.set_cold_time("shield");
        }
    }

    shoot_eight_track_bullet() {
        let track_bullet_array = [];
        for (let i = 0; i < 8; i++) {
            let track_bullet = this.shoot_track_bullet(i * Math.PI * 2 / 8);
            track_bullet_array.push(track_bullet);
        }
        this.skill_icon.set_cold_time("track_bullet");
        return track_bullet_array;
    }

    shoot_track_bullet(angle) {
        let x = this.x, y = this.y;
        let vx = Math.cos(angle), vy = Math.sin(angle);

        let track_bullet = new TrackBullet(this.playground, this, x, y, vx, vy);
        // 将新生成的火球放进自己的火球数组里
        this.fireballs.push(track_bullet);

        // if (this.character !== "robot") {
        //     this.skill_icon.fireball_coldtime = this.skill_icon.base_fireball_coldtime;
        // }

        // 返回刚刚发射的火球（用于在room里同步所有子弹的uuid）
        return track_bullet;
    }

    shoot_fireball(tx, ty) {
        let x = this.x, y = this.y;
        this.angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(this.angle), vy = Math.sin(this.angle);

        let fireball = new FireBall(this.playground, this, x, y, vx, vy);
        // 将新生成的火球放进自己的火球数组里
        this.fireballs.push(fireball);

        if (this.character !== "robot") {
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
        this.skill_icon.set_cold_time("blink");

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

class ScoreBoard extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;

        // win：胜利，lose：失败
        this.state = null

        this.win_img = new Image();
        this.win_img.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_8f58341a5e-win.png";

        this.lose_img = new Image();
        this.lose_img.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_9254b5f95e-lose.png";
    }

    start() {
    }

    add_listening_events() {
        let outer = this;
        if (!this.playground.game_map) {
            return true;
        }
        let $canvas = this.playground.game_map.$canvas;

        // 这里不需要用`click.${outer.uuid}`来手动移除监听事件
        // 因为这个事件在执行的时候会调用outer.playground.hide();
        // 这个函数会把整个$canvas移除掉，那么监听事件本身就不存在了
        $canvas.on('click', function () {
            outer.playground.hide();
            outer.playground.root.menu.show();
        });
    }

    win() {
        this.state = "win";

        let outer = this;
        setTimeout(function () {
            outer.add_listening_events();
        }, 500);
    }

    lose() {
        this.state = "lose";

        let outer = this;
        setTimeout(function () {
            outer.add_listening_events();
        }, 500);
    }

    late_update() {
        this.render();
    }

    render() {
        let len = this.playground.height / 2;
        if (this.state === "win") {
            this.ctx.drawImage(this.win_img, this.playground.width / 2 - len / 2, this.playground.height / 2 - len / 2, len, len);
        } else if (this.state === "lose") {
            this.ctx.drawImage(this.lose_img, this.playground.width / 2 - len / 2, this.playground.height / 2 - len / 2, len, len);
        }
    }
}class Bullet extends AcGameObject {
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

class FireBall extends AcGameObject {
    constructor(playground, player, x, y, vx, vy) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.x = x;
        this.y = y;
        this.radius = 0.01;
        this.vx = vx;
        this.vy = vy;
        this.color = "orange";
        this.speed = 0.5;
        this.move_length = 0.8;
        this.damage = 0.01;
        this.hp_damage = 25;

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

    // 火球攻击逻辑
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

        // 只有多人模式下才需要广播火球攻击
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
}class SkillIcon extends AcGameObject {
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
}class TrackBullet extends FireBall {
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
}class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;

        // 建立websocket连接
        this.ws = new WebSocket("wss://app383.acapp.acwing.com.cn:31443/wss/multiplayer/");

        this.start();
    }

    start() {
        this.receive();
    }

    // 从前端接收信息
    receive() {
        let outer = this;

        this.ws.onmessage = function (e) {
            // 将一个字符串加载成字典
            let data = JSON.parse(e.data);
            let uuid = data.uuid;
            // 如果收到的是自己发给自己的信息就跳过
            if (uuid === outer.uuid) return false;

            // 路由
            let event = data.event;
            if (event === "create_player") {
                outer.receive_create_player(uuid, data.username, data.photo);
            } else if (event === "move_to") {
                outer.receive_move_to(uuid, data.tx, data.ty);
            } else if (event === "shoot_fireball") {
                outer.receive_shoot_fireball(uuid, data.tx, data.ty, data.ball_uuid);
            } else if (event === "attack") {
                outer.receive_attack(uuid, data.attackee_uuid, data.x, data.y, data.angle, data.damage, data.hp_damage, data.ball_uuid);
            } else if (event === "blink") {
                outer.receive_blink(uuid, data.tx, data.ty);
            } else if (event === "message") {
                outer.receive_message(uuid, data.username, data.text);
            } else if (event === "shoot_bullet") {
                outer.receive_shoot_bullet(uuid, data.tx, data.ty, data.bullet_uuid);
            } else if (event === "stop") {
                outer.receive_stop_player(uuid);
            }
        };
    }

    send_create_player(username, photo) {
        let outer = this;

        // 向后端服务器发送信息
        // JSON.stringify：将一个json封装成字符串
        this.ws.send(JSON.stringify({
            'event': "create_player",
            'uuid': outer.uuid,
            'username': username,
            'photo': photo,
        }));
    }

    // 通过uuid找到对应的player
    get_player(uuid) {
        let players = this.playground.players;
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            if (player.uuid === uuid) {
                return player;
            }
        }

        return null;
    }

    // 多人模式里在前端创建其他玩家
    receive_create_player(uuid, username, photo) {
        let player = new Player(
            this.playground,
            this.playground.width / 2 / this.playground.scale,
            0.5,
            0.05,
            "white",
            0.15,
            "enemy",
            username,
            photo
        );

        player.uuid = uuid;
        this.playground.players.push(player);
    }

    send_move_to(tx, ty) {
        let outer = this;

        this.ws.send(JSON.stringify({
            'event': "move_to",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_move_to(uuid, tx, ty) {
        let player = this.get_player(uuid);

        if (player) {
            player.move_to(tx, ty);
        }
    }

    send_shoot_fireball(tx, ty, ball_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "shoot_fireball",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_shoot_fireball(uuid, tx, ty, ball_uuid) {
        let player = this.get_player(uuid);
        if (player) {
            // player/zbase.js 里面 return fireball; 的作用就体现出来了
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid;
        }
    }

    // attackee_uuid：被攻击者的uuid
    // 被击中的同时向所有窗口发送数据，修正被击中玩家位置、角度、上海、火球uuid
    send_attack(attackee_uuid, x, y, angle, damage, hp_damage, ball_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "attack",
            'uuid': outer.uuid,
            "attackee_uuid": attackee_uuid,
            'x': x,
            'y': y,
            'angle': angle,
            'damage': damage,
            'hp_damage': hp_damage,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_attack(uuid, attackee_uuid, x, y, angle, damage, hp_damage, ball_uuid) {
        let attacker = this.get_player(uuid);
        let attackee = this.get_player(attackee_uuid);
        if (attacker && attackee) {
            // 虽然名字相同，但这里调用的是被攻击者自己的函数，写在Player类里面
            attackee.receive_attack(x, y, angle, damage, hp_damage, ball_uuid, attacker);
        }
    }

    send_blink(tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "blink",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_blink(uuid, tx, ty) {
        let player = this.get_player(uuid);
        if (player) {
            player.blink(tx, ty);
        }
    }

    send_message(username, text) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "message",
            'uuid': outer.uuid,
            'username': username,
            'text': text,
        }));
    }

    receive_message(uuid, username, text) {
        this.playground.chat_field.add_message(username, text);
    }

    send_shoot_bullet(tx, ty, bullet_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "shoot_bullet",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
            'bullet_uuid': bullet_uuid,
        }));
    }

    receive_shoot_bullet(uuid, tx, ty, bullet_uuid) {
        let player = this.get_player(uuid);
        if (player) {
            // player/zbase.js 里面 return fireball; 的作用就体现出来了
            let bullet = player.shoot_bullet(tx, ty);
            bullet.uuid = bullet_uuid;
        }
    }

    send_stop_player(uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "stop",
            'uuid': outer.uuid,
        }));
    }

    receive_stop_player(uuid) {
        let player = this.get_player(uuid);
        if (player) {
            player.move_length = 0;
        }
    }
}class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground"></div>`);
        this.operator = "pc"; // pc - phone

        this.hide();

        // 在show()之前append，为了之后实时更新地图大小
        this.root.$ac_game.append(this.$playground);

        this.start();
    }

    add_enemy() {
        this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot"));
    }

    get_random_color() {
        let colors = ["blue", "red", "pink", "grey", "green"];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 创建一个唯一编号用来准确移除resize监听函数
    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i++) {
            let x = parseInt(Math.floor(Math.random() * 10)); // 返回[0, 1)
            res += x;
        }
        return res;
    }

    start() {
        let outer = this;

        let uuid = this.create_uuid();
        // 用户改变窗口大小的时候就会触发这个事件
        // 用on来绑定监听函数，之后就可以用off来移除
        $(window).on(`resize.${uuid}`, function () {
            outer.resize();
        });

        if (this.root.AcWingOS) {
            this.root.AcWingOS.api.window.on_close(function () {
                $(window).off(`resize.${uuid}`);
                outer.hide();
            });
        }

        // 查看用户当前使用什么设备登录
        this.operator = this.check_operator();
    }

    check_operator() {
        let sUserAgent = navigator.userAgent.toLowerCase();
        let pc = sUserAgent.match(/windows/i) == "windows";
        if (!pc) {
            return "phone";
        } else {
            return "pc";
        }
    }

    // 让界面的长宽比固定为16：9，并且等比例放到最大
    resize() {
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        let unit = Math.min(this.width / 16, this.height / 9);
        this.width = unit * 16;
        this.height = unit * 9;

        // 基准
        this.scale = this.height;

        // 调用一下GameMap的resize()
        if (this.game_map) this.game_map.resize();
    }

    show(mode) {  // 打开playground界面
        let outer = this;

        this.$playground.show();

        this.resize();

        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.game_map = new GameMap(this);

        this.mode = mode;
        this.state = "waiting";  // waiting -> fighting -> over
        this.notice_board = new NoticeBoard(this);
        this.score_board = new ScoreBoard(this);
        this.player_count = 0;

        this.resize();

        this.players = [];
        // 绘制玩家
        this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, "white", 0.15, "me", this.root.settings.username, this.root.settings.photo));

        if (mode === "single mode") {
            // 绘制若干敌人
            for (let i = 0; i < 8; i++) {
                this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot"));
            }
        } else if (mode === "multi mode") {
            // 添加聊天框
            this.chat_field = new ChatField(this);
            this.mps = new MultiPlayerSocket(this);
            // 使用自己的uuid（自己永远是第一个被加入数组里面的）
            this.mps.uuid = this.players[0].uuid;

            // 连接创建成功时的回调函数
            this.mps.ws.onopen = function () {
                outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
            };
        }
    }

    hide() {  // 关闭playground界面
        while (this.players && this.players.length > 0) {
            // AcGameObject.destroy() ----> Player.on_destroy()
            //                          \--> AC_GAME_OBJECTS.splice(i, 1)
            this.players[0].destroy();
        }

        if (this.score_board) {
            this.score_board.destroy();
            this.score_board = null;
        }

        if (this.game_map) {
            this.game_map.destroy();
            this.game_map = null;
        }

        if (this.notice_board) {
            this.notice_board.destroy();
            this.notice_board = null;
        }



        // 清空当前的html对象
        this.$playground.empty();

        this.$playground.hide();
    }
}class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.AcWingOS) this.platform = "ACAPP";
        this.username = "";
        this.photo = "";

        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app383.acapp.acwing.com.cn:31443/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app383.acapp.acwing.com.cn:31443/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
</div>
    
        `);

        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");

        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");

        this.$register.hide();

        this.$acwing_login = this.$settings.find('.ac-game-settings-acwing img');

        this.root.$ac_game.append(this.$settings);

        this.start();
    }

    start() {
        if (this.platform === "ACAPP") {
            this.getinfo_acapp();
        } else if (this.platform === "WEB") {
            this.getinfo_web();
            this.add_listening_events();
        } else {
            console.log("not known what is platform");
        }
    }

    add_listening_events() {
        let outer = this;
        this.add_listening_events_login();
        this.add_listening_events_register();

        this.$acwing_login.click(function () {
            outer.acwing_login();
        });
    }

    add_listening_events_login() {
        let outer = this;

        // 登录界面跳转到注册界面
        this.$login_register.click(function () {
            outer.register();
        });
        // 登录按钮
        this.$login_submit.click(function () {
            outer.login_on_remote();
        });
    }

    add_listening_events_register() {
        let outer = this;

        // 注册界面跳转到登录界面
        this.$register_login.click(function () {
            outer.login();
        });
        // 注册按钮
        this.$register_submit.click(function () {
            outer.register_on_remote();
        });
    }

    // acwing一键登录
    acwing_login() {
        $.ajax({
            url: "https://app383.acapp.acwing.com.cn:31443/settings/acwing/web/apply_code/",
            type: "GET",
            success: function (resp) {
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                }
            }
        });
    }

    // 在远程服务器上登录
    login_on_remote() {
        let outer = this;
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();

        $.ajax({
            url: "https://app383.acapp.acwing.com.cn:31443/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function (resp) {
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$login_error_message.html(resp.result);
                }
            }
        });
    }

    // 在远程服务器上注册
    register_on_remote() {
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url: "https://app383.acapp.acwing.com.cn:31443/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function (resp) {
                if (resp.result === "success") {
                    location.reload();  // 刷新页面
                } else {
                    // 展示错误信息
                    outer.$register_error_message.html(resp.result);
                }
            }
        });
    }

    // 在远程服务器上登出
    logout_on_remote() {
        if (this.platform === "ACAPP") {
            // 调用acwing关闭窗口的api
            this.root.AcWingOS.api.window.close();
        } else {
            $.ajax({
                url: "https://app383.acapp.acwing.com.cn:31443/settings/logout/",
                type: "GET",
                success: function (resp) {
                    if (resp.result === "success") {
                        // 刷新页面
                        location.reload();
                    }
                }
            });
        }
    }

    // 打开注册界面
    register() {
        this.$login.hide();
        this.$register.show();
    }

    // 打开登陆界面
    login() {
        this.$register.hide();
        this.$login.show();
    }

    // acapp端一键登录
    acapp_login(appid, redirect_uri, scope, state) {
        let outer = this;

        this.root.AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function (resp) {
            if (resp.result === "success") {
                // 获取用户信息成功的话就存储用户信息
                outer.username = resp.username;
                outer.photo = resp.photo;

                // 打开菜单界面
                outer.hide();
                outer.root.menu.show();
            }
        });
    }

    getinfo_acapp() {
        let outer = this;

        $.ajax({
            url: "https://app383.acapp.acwing.com.cn:31443/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function (resp) {
                if (resp.result === "success") {
                    outer.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }
            }
        });
    }

    getinfo_web() {
        let outer = this;

        $.ajax({
            url: "https://app383.acapp.acwing.com.cn:31443/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function (resp) {
                if (resp.result === "success") {
                    // 获取用户信息成功的话就存储用户信息
                    outer.username = resp.username;
                    outer.photo = resp.photo;

                    // 打开菜单界面
                    outer.hide();
                    outer.root.menu.show();
                } else {
                    outer.login();
                }
            }
        });
    }

    hide() {
        this.$settings.hide();
    }

    show() {
        this.$settings.show();
    }
}export class AcGame {
    constructor(id, AcWingOS) {
        this.id = id;
        // 前面加$表示js对象，前面加#能够找到id对应的div
        this.$ac_game = $('#' + id);
        this.AcWingOS = AcWingOS;

        // 顺序不要随便换
        this.settings = new Settings(this);
        this.menu = new AcGameMenu(this);
        this.playground = new AcGamePlayground(this);

        this.start();
    }

    start() {

    }
}

