package pacman.view.keyboard.command;

import pacman.model.engine.GameEngine;
import pacman.model.entity.dynamic.physics.Direction;

/**
 * Move down command
 */
public class MoveDownCommand implements MoveCommand {

    public GameEngine model;

    public MoveDownCommand(GameEngine model) {
        this.model = model;
    }

    public void execute() {
        model.moveDown();
    }

    public Direction getDirection() {
        return Direction.DOWN;
    }
}
