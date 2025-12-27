const express = require('express');
const {
  listPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
} = require('../controllers/placementController');

const router = express.Router();

router.get('/', listPlacements);
router.post('/', createPlacement);
router.put('/:id', updatePlacement);
router.delete('/:id', deletePlacement);
router.post('/:id/register', require('../controllers/placementController').registerForPlacement);

module.exports = router;


