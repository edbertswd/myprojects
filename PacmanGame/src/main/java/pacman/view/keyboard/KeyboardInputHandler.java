package pacman.view.keyboard;

import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import pacman.model.engine.GameEngine;
import pacman.model.entity.dynamic.physics.Direction;
import pacman.model.entity.dynamic.player.MovementInvoker;
import pacman.view.keyboard.command.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Responsible for handling keyboard input from player
 */
public class KeyboardInputHandler {
    private final Map<Direction, MoveCommand> commands;
    private final MovementInvoker movementInvoker;

    public KeyboardInputHandler(GameEngine engine) {
        this.commands = new HashMap<>();
        this.commands.put(Direction.LEFT, new MoveLeftCommand(engine));
        this.commands.put(Direction.RIGHT, new MoveRightCommand(engine));
        this.commands.put(Direction.UP, new MoveUpCommand(engine));
        this.commands.put(Direction.DOWN, new MoveDownCommand(engine));
        this.movementInvoker = MovementInvoker.getInstance();
    }

    private Direction getDirection(KeyCode keyCode) {
        return switch (keyCode) {
            case LEFT -> Direction.LEFT;
            case RIGHT -> Direction.RIGHT;
            case DOWN -> Direction.DOWN;
            case UP -> Direction.UP;
            default -> null;
        };
    }

    public void handlePressed(KeyEvent keyEvent) {
        KeyCode keyCode = keyEvent.getCode();

        MoveCommand command = commands.get(getDirection(keyCode));
        if (command != null) {
            movementInvoker.addCommand(command);
        }
    }
}
