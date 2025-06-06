class MultiPlayerSocket {
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
}