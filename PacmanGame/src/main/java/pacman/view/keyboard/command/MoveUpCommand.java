package pacman.view.keyboard.command;

import pacman.model.engine.GameEngine;
import pacman.model.entity.dynamic.physics.Direction;

/**
 * Move up command
 */
public class MoveUpCommand implements MoveCommand {

    public GameEngine model;

    public MoveUpCommand(GameEngine model) {
        this.model = model;
    }

    @Override
    public void execute() {
        model.moveUp();
    }

    @Override
    public Direction getDirection() {
        return Direction.UP;
    }
}
