class AcGameMenu {
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
}