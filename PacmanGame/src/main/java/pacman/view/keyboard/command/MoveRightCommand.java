package pacman.view.keyboard.command;

import pacman.model.engine.GameEngine;
import pacman.model.entity.dynamic.physics.Direction;

/**
 * Move right command
 */
public class MoveRightCommand implements MoveCommand {

    public GameEngine model;

    public MoveRightCommand(GameEngine model) {
        this.model = model;
    }

    public void execute() {
        model.moveRight();
    }

    public Direction getDirection() {
        return Direction.RIGHT;
    }
}
