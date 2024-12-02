package pacman.view.keyboard.command;

import pacman.model.entity.dynamic.physics.Direction;

/**
 * Movement command player has requested
 */
public interface MoveCommand {
    /**
     * Executes the movement command
     */
    void execute();

    /**
     * Retrieves the direction of the movement command
     *
     * @return direction of the movement comamnd
     */
    Direction getDirection();
}
