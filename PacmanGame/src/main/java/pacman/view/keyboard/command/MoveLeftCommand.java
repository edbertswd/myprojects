package pacman.view.keyboard.command;

import pacman.model.engine.GameEngine;
import pacman.model.entity.dynamic.physics.Direction;

/**
 * Move left command
 */
public class MoveLeftCommand implements MoveCommand {

    public GameEngine model;

    public MoveLeftCommand(GameEngine model) {
        this.model = model;
    }

    public void execute() {
        model.moveLeft();
    }

    public Direction getDirection() {
        return Direction.LEFT;
    }
}