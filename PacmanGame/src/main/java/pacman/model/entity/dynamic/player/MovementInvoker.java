package pacman.model.entity.dynamic.player;

import pacman.model.entity.dynamic.physics.Direction;
import pacman.view.keyboard.command.MoveCommand;

import java.util.Set;

/**
 * Handles the execution of moves requested by player
 */
public class MovementInvoker {

    private static MovementInvoker instance;
    private MoveCommand currentCommand;
    private MoveCommand queuedCommand;

    private MovementInvoker() {
    }

    /**
     * Retrieves the singleton instance of MovementInvoker
     *
     * @return MovementInvoker object
     */
    public static MovementInvoker getInstance() {
        if (instance == null) {
            instance = new MovementInvoker();
        }
        return instance;
    }

    /**
     * Handles a new command by player.
     * If there is no command currently set, it will be set to the current command immediately, otherwise,
     * it will be queued. Only the latest command given by the player will be queued.
     *
     * @param command new command from player
     */
    public void addCommand(MoveCommand command) {
        if (currentCommand == null) {
            currentCommand = command;
            queuedCommand = null;
        } else {
            // only queue the latest command given
            queuedCommand = command;
        }
    }

    /**
     * Based on the possible directions of Pac-Man, it will execute the queued command of the
     * player if possible, otherwise, it will continue executing the current command.
     *
     * @param possibleDirections possible directions of Pac-Man
     */
    public void update(Set<Direction> possibleDirections) {
        if (queuedCommand != null && possibleDirections.contains(queuedCommand.getDirection())) {
            queuedCommand.execute();
            // reset
            currentCommand = queuedCommand;
            queuedCommand = null;
        } else if (currentCommand != null && possibleDirections.contains(currentCommand.getDirection())) {
            currentCommand.execute();
        }
    }

    /**
     * Resets the commands stored from the player
     */
    public void reset() {
        this.queuedCommand = null;
        this.currentCommand = null;
    }

}
