package pacman.model.entity.staticentity.collectable;

import javafx.scene.image.Image;
import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.physics.BoundingBox;
import pacman.model.level.LevelImpl;

/**
 * Represents a Power Pellet that Pac-Man can collect in the game.
 * It triggers FRIGHTENED mode for all ghosts when collected.
 */
public class PowerPellet extends Pellet {
    private boolean isCollectable;
    private LevelImpl levelImpl;

    /**
     * Constructs a PowerPellet.
     * 
     * @param boundingBox The bounding box representing the power pellet's position and size.
     * @param layer The render layer of the pellet.
     * @param image The image of the pellet.
     * @param points The number of points the player earns for collecting this power pellet.
     */
    public PowerPellet(BoundingBox boundingBox, Renderable.Layer layer, Image image, int points) {
        super(boundingBox, layer, image, points);  // Call to parent Pellet class constructor
        this.isCollectable = true;
    }

    /**
     * Set this power pellet's level implementation
     * @param levelImpl
     */
    public void setLevelImplementation(LevelImpl levelImpl){
        this.levelImpl = levelImpl;
    }


    /**
     * Collect the power pellet, triggering the frightened mode for all ghosts.
     */
    @Override
    public void collect() {
        if (isCollectable) {
            triggerFrightenedMode(levelImpl);

            // Mark this power pellet as no longer collectable
            this.isCollectable = false;
            setLayer(Layer.INVISIBLE);
        }
    }

    /**
     * Returns whether the power pellet is currently collectable.
     *
     * @return true if the power pellet can be collected, false otherwise.
     */
    @Override
    public boolean isCollectable() {
        return this.isCollectable;
    }

    /**
     * Trigger All Ghost's Decorator Frightened Mode
     * @param l Level Implementation
     */
    public void triggerFrightenedMode(LevelImpl l) {
        l.activateFrightenedModeForAllGhosts();
        
    }

    /**
     * Resets power pellet to be collectable
     */
    public void resetCollectableStatus() {
        this.isCollectable = true; 
    }
}
