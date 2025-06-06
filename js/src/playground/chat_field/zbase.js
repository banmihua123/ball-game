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
}