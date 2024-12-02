package pacman.model.entity.dynamic.physics;

import pacman.model.entity.dynamic.DynamicEntity;
import pacman.model.entity.staticentity.StaticEntity;

/**
 * Primitive PhysicsEngine implementation.
 */
public class PhysicsEngine {

    /**
     * Resolves collision between a dynamic entity a and static entity b
     *
     * @param a dynamic entity colliding with b
     * @param b static entity that a has collided into
     */
    public static void resolveCollision(
            DynamicEntity a,
            StaticEntity b) {

        if (b.canPassThrough()) {
            return;
        }

        // set position back to position prior to collision
        Vector2D aPreviousPosition = a.getPositionBeforeLastUpdate();
        a.setPosition(aPreviousPosition);
    }
}

